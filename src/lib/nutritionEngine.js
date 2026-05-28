/**
 * Nutrition cascade — orchestrates the TACO → Open Food Facts → Gemini
 * fallback chain and persists the result as a MealEntry.
 *
 * Flow:
 *   1. User text + optional Gemini key → list of parsed items.
 *      - With Gemini key: full NLP parsing (preferred — handles "almocei
 *        arroz, feijão, frango").
 *      - Without key: offline parser splits the text and runs TACO lookups.
 *   2. For each item, resolve nutrition via the cascade:
 *        TACO match >= 0.7 → use TACO (cheap, offline, trusted)
 *        else Open Food Facts hit with completeness >= 0.7 → use OFF
 *        else fall back to whatever Gemini already returned (or estimate it)
 *   3. Persist via db.js.
 *
 * Exports: parseDescription, resolveItems, persistMeal, fullPipeline,
 *          recomputeTotals
 */

import { lookup as tacoLookup, scaleNutrients } from './taco.js';
import { searchByName as offSearch } from './openfoodfacts.js';
import { parseMealDescription, estimateNutrition, isConfigured as hasGemini, GeminiError } from './gemini.js';
import { saveMeal } from './db.js';
import { parseQuantityWithName } from './units.js';
import { kcalFromMacros, uuid, normalize, round1 } from './format.js';

/** @typedef {import('./db.js').FoodItem} FoodItem */
/** @typedef {import('./db.js').MealEntry} MealEntry */

const TACO_ACCEPT = 0.7; // below this we try OFF
const OFF_ACCEPT = 0.7;

/**
 * @description Step 1 — turn a description into raw items. Uses Gemini if a
 *   key is configured; otherwise a deterministic offline parser.
 * @param {string} description
 * @returns {Promise<{ items: Partial<FoodItem>[], usedGemini: boolean, warning?: string }>}
 */
export async function parseDescription(description) {
  if (hasGemini()) {
    try {
      const raw = await parseMealDescription(description);
      const items = raw.map((it) => ({
        name: it.name,
        quantityText: it.quantityText,
        grams: it.grams || 100,
        kcal: it.kcal,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
        source: 'gemini',
        confidence: it.confidence ?? 0.6,
      }));
      return { items, usedGemini: true };
    } catch (err) {
      // Fall through to the offline path so the user still gets *something*.
      return {
        ...offlineParse(description),
        warning: err instanceof GeminiError ? err.message : 'Falha no Gemini, usando parser offline.',
      };
    }
  }
  return offlineParse(description);
}

function offlineParse(description) {
  // Split on commas, " e ", " com " — the joiners users actually type.
  const tokens = description
    .split(/,| e | com |;|\n|\+/i)
    .map((t) => t.trim())
    .filter(Boolean);
  const items = tokens.map((token) => {
    const { name, quantity } = parseQuantityWithName(token);
    return {
      name: name || token,
      quantityText: token,
      grams: quantity.grams,
      // No nutrition yet — the cascade resolves it.
      kcal: 0, protein: 0, carbs: 0, fat: 0,
      source: 'manual',
      confidence: quantity.confidence * 0.7,
    };
  });
  return { items, usedGemini: false };
}

/**
 * @description Step 2 — resolve nutrition for each raw item via the cascade.
 *   Items that came from Gemini with high self-confidence skip the lookups
 *   to save quota; everything else tries TACO → OFF → Gemini-estimate.
 * @param {Partial<FoodItem>[]} rawItems
 * @returns {Promise<FoodItem[]>}
 */
export async function resolveItems(rawItems) {
  const out = [];
  for (const raw of rawItems) {
    const grams = raw.grams || 100;
    const name = normalize(raw.name);

    // Trust Gemini's numbers when self-confidence is high — same call already
    // produced grams + macros, so we'd be wasting quota re-resolving.
    if (raw.source === 'gemini' && (raw.confidence ?? 0) >= 0.7 && raw.kcal > 0) {
      out.push(asFood(raw, grams));
      continue;
    }

    const taco = tacoLookup(name);
    if (taco && taco.confidence >= TACO_ACCEPT) {
      const macros = scaleNutrients(taco.item, grams);
      out.push({
        name: taco.item.name,
        quantityText: raw.quantityText || `${Math.round(grams)} g`,
        grams,
        kcal: macros.kcal,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        source: 'taco',
        confidence: taco.confidence,
        tacoId: taco.item.id,
      });
      continue;
    }

    const off = await offSearch(name);
    if (off && off.confidence >= OFF_ACCEPT) {
      const k = grams / 100;
      out.push({
        name: off.name,
        quantityText: raw.quantityText || `${Math.round(grams)} g`,
        grams,
        kcal: off.per100g.kcal * k,
        protein: off.per100g.protein * k,
        carbs: off.per100g.carbs * k,
        fat: off.per100g.fat * k,
        source: 'off',
        confidence: off.confidence,
        offCode: off.code,
      });
      continue;
    }

    // Last resort: ask Gemini for a per-100g estimate (if we have a key).
    // If not, keep whatever the offline parser had so totals stay non-zero.
    if (hasGemini()) {
      try {
        const est = await estimateNutrition(name);
        const k = grams / 100;
        out.push({
          name: raw.name,
          quantityText: raw.quantityText || `${Math.round(grams)} g`,
          grams,
          kcal: est.kcal * k,
          protein: est.protein * k,
          carbs: est.carbs * k,
          fat: est.fat * k,
          source: 'gemini',
          confidence: est.confidence * 0.7,
        });
        continue;
      } catch {
        // Fall through to the bare raw item below.
      }
    }

    out.push(asFood(raw, grams));
  }
  return out;
}

function asFood(raw, grams) {
  // If Gemini gave macros but not kcal (or vice versa), reconcile via Atwater.
  const macros = {
    protein: raw.protein || 0,
    carbs: raw.carbs || 0,
    fat: raw.fat || 0,
  };
  const kcal = raw.kcal > 0 ? raw.kcal : kcalFromMacros(macros);
  return {
    name: raw.name,
    quantityText: raw.quantityText || `${Math.round(grams)} g`,
    grams,
    kcal,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    source: raw.source || 'manual',
    confidence: raw.confidence ?? 0.4,
  };
}

/**
 * @description Aggregate macros across an array of items. Rounded for display.
 * @param {FoodItem[]} items
 * @returns {{kcal:number,protein:number,carbs:number,fat:number}}
 */
export function recomputeTotals(items) {
  const t = items.reduce(
    (acc, it) => ({
      kcal: acc.kcal + (it.kcal || 0),
      protein: acc.protein + (it.protein || 0),
      carbs: acc.carbs + (it.carbs || 0),
      fat: acc.fat + (it.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return {
    kcal: Math.round(t.kcal),
    protein: round1(t.protein),
    carbs: round1(t.carbs),
    fat: round1(t.fat),
  };
}

/**
 * @description Step 3 — build a MealEntry from items and persist it.
 * @param {object} args
 * @param {FoodItem[]} args.items
 * @param {string} args.rawDescription
 * @param {'cafe'|'pre'|'almoco'|'pos'|'jantar'|'lanche'} args.mealType
 * @param {number} [args.timestamp] - defaults to Date.now()
 * @returns {Promise<MealEntry>}
 */
export async function persistMeal({ items, rawDescription, mealType, timestamp }) {
  const entry = {
    id: uuid(),
    timestamp: timestamp ?? Date.now(),
    mealType,
    rawDescription,
    items,
    totals: recomputeTotals(items),
  };
  await saveMeal(entry);
  return entry;
}

/**
 * @description Convenience wrapper used by QuickLogSheet: parse → resolve →
 *   return items ready for confirmation. Does NOT persist — the
 *   ConfirmationView decides when to call persistMeal.
 * @param {string} description
 * @returns {Promise<{ items: FoodItem[], usedGemini: boolean, warning?: string }>}
 */
export async function fullPipeline(description) {
  const { items: raw, usedGemini, warning } = await parseDescription(description);
  const items = await resolveItems(raw);
  return { items, usedGemini, warning };
}

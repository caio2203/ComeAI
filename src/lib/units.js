/**
 * Portuguese (pt-BR) quantity → grams parser.
 *
 * Translates expressions athletes actually type/speak into grams of edible
 * portion. Used by the offline parser and as a safety net when Gemini omits
 * a numeric quantity.
 *
 * Heuristic table — not a precise food-science measurement. The
 * confirmation screen lets the user override every value, so being close
 * matters more than being exact.
 *
 * Exports: parseQuantity, parseQuantityWithName
 */

import { normalize } from './format.js';

// Median weights of common Brazilian household units, in grams. Numbers come
// from TACO's "medida caseira" tables and aggregated nutrition references.
const HOUSEHOLD = {
  'colher de sopa': 15,
  'colher de cha': 5,
  'colher de chá': 5,
  'colher': 12,
  'concha': 80,
  'xicara': 150,
  'xícara': 150,
  'copo': 200,
  'copo americano': 200,
  'copo de requeijao': 240,
  'copo de requeijão': 240,
  'taca': 150,
  'taça': 150,
  'lata': 350,
  'garrafa': 500,
  'garrafinha': 300,
  'prato': 250,
  'prato raso': 300,
  'pegador': 80,
  'porcao': 100,
  'porção': 100,
  'fatia': 25,
  'fatia fina': 15,
  'fatia grossa': 50,
  'pedaco': 60,
  'pedaço': 60,
  'unidade': 100,
  'un': 100,
  'pote': 170,
  'pacote': 100,
  'dose': 50,
  'punhado': 30,
};

// Food-specific median weights of "1 unit". These override the generic 100 g
// when "1 banana" / "1 ovo" appears without a measurement.
const UNIT_WEIGHTS = [
  { match: ['banana'],            grams: 90 },
  { match: ['maca', 'maçã'],      grams: 130 },
  { match: ['laranja'],           grams: 180 },
  { match: ['mamao', 'mamão', 'papaia'], grams: 200 },
  { match: ['ovo'],               grams: 50 },
  { match: ['pao frances', 'pão francês', 'pao'], grams: 50 },
  { match: ['fatia de pao', 'fatia de pão'], grams: 25 },
  { match: ['biscoito', 'bolacha'], grams: 6 },
  { match: ['pao de queijo'],     grams: 25 },
  { match: ['kiwi'],              grams: 75 },
  { match: ['morango'],           grams: 12 },
  { match: ['castanha'],          grams: 5 },
  { match: ['amendoa', 'amêndoa'], grams: 1.2 },
  { match: ['noz'],               grams: 5 },
];

const NUMBER = /(\d+(?:[.,]\d+)?|meio|meia|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|dez)/i;
const NUM_MAP = { meio: 0.5, meia: 0.5, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, três: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10 };

const toNumber = (raw) => {
  const k = raw.toLowerCase();
  if (k in NUM_MAP) return NUM_MAP[k];
  return parseFloat(raw.replace(',', '.'));
};

/**
 * @typedef {object} QuantityParse
 * @property {number} grams              Best-effort gram estimate.
 * @property {number} confidence         0..1 — caller decides if it's good enough.
 * @property {string} reason              Short explanation, useful for debug.
 */

/**
 * @description Parse a free-text quantity phrase ("2 colheres de sopa",
 *   "100g", "uma banana") into grams. Falls back to 100 g (confidence 0.3)
 *   when nothing matches, so callers always get a number.
 * @param {string} text - The quantity phrase. May embed the food name.
 * @param {string} [foodName] - Optional food name to pick unit-weight overrides.
 * @returns {QuantityParse}
 */
export function parseQuantity(text, foodName = '') {
  const t = normalize(text);
  if (!t) return { grams: 100, confidence: 0.3, reason: 'empty → default 100 g' };

  // Direct mass: "200g", "1,5 kg", "150 gramas" — longest units first so
  // "gramas" wins over "g" (otherwise "g" would match inside "gramas").
  const mass = t.match(/(\d+(?:[.,]\d+)?)\s*(kg|gramas?|g)\b/);
  if (mass) {
    const n = parseFloat(mass[1].replace(',', '.'));
    const grams = mass[2].startsWith('k') ? n * 1000 : n;
    return { grams, confidence: 0.95, reason: `mass match: ${mass[0]}` };
  }

  // Direct volume (liquids): "200 ml", "1 l" — 1 ml ≈ 1 g for water-like.
  // The trailing \b keeps a bare "l" from swallowing foods that merely start
  // with it ("1 laranja", "1 lata"), which should hit the tables below.
  const vol = t.match(/(\d+(?:[.,]\d+)?)\s*(ml|litros?|l)\b/);
  if (vol) {
    const n = parseFloat(vol[1].replace(',', '.'));
    const grams = vol[2].startsWith('l') ? n * 1000 : n;
    return { grams, confidence: 0.8, reason: `volume match: ${vol[0]} (≈ 1 ml/g)` };
  }

  // Household measure: "2 colheres de sopa", "1 copo", "meia xícara"
  for (const [unit, gPerUnit] of Object.entries(HOUSEHOLD)) {
    if (t.includes(unit)) {
      const m = t.match(new RegExp(`${NUMBER.source}\\s+${unit.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`, 'i'));
      const n = m ? toNumber(m[1]) : 1;
      return { grams: n * gPerUnit, confidence: 0.7, reason: `${n} × "${unit}" (${gPerUnit} g)` };
    }
  }

  // Food-specific unit weight: "2 bananas", "1 ovo"
  const fName = normalize(foodName || t);
  for (const entry of UNIT_WEIGHTS) {
    if (entry.match.some((k) => fName.includes(k))) {
      const m = t.match(NUMBER);
      const n = m ? toNumber(m[1]) : 1;
      return { grams: n * entry.grams, confidence: 0.6, reason: `${n} × unit "${entry.match[0]}" (${entry.grams} g)` };
    }
  }

  // Bare number: "3 frangos" → 3 × 100 g default
  const bare = t.match(NUMBER);
  if (bare) {
    const n = toNumber(bare[1]);
    return { grams: n * 100, confidence: 0.4, reason: `bare number ${n} → ${n} × 100 g` };
  }

  return { grams: 100, confidence: 0.3, reason: 'no signal → default 100 g' };
}

/**
 * @description Pull "<qty> <name>" out of a raw token. Removes the matched
 *   quantity prefix so what remains is the cleaner food name.
 * @param {string} token - e.g. "200g de arroz branco" or "duas bananas"
 * @returns {{ name: string, quantity: QuantityParse }}
 */
export function parseQuantityWithName(token) {
  const cleaned = token.replace(/\b(de|da|do|com)\b/gi, ' ').trim();
  const q = parseQuantity(cleaned);
  // Strip the number+unit prefix to leave the name. Crude but works for the
  // common phrasings we feed it.
  const name = cleaned
    .replace(/(\d+(?:[.,]\d+)?\s*(kg|g|gramas?|ml|l|litros?))/i, '')
    .replace(new RegExp(NUMBER.source, 'i'), '')
    .replace(/\b(colher(?:es)?(?: de (?:sopa|cha|chá))?|concha|x[ií]cara|copo|ta[çc]a|lata|garrafa|prato|porc?[aã]o|fatia|peda[çc]o|unidade|un|pote|pacote|dose|punhado)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { name, quantity: q };
}

// ponytail: self-check for the regex ordering — `node src/lib/units.js`.
if (import.meta.url === `file://${process.argv[1]}`) {
  const eq = (text, grams) => {
    const g = parseQuantity(text).grams;
    if (g !== grams) throw new Error(`parseQuantity("${text}") = ${g}, expected ${grams}`);
  };
  eq('1 laranja', 180);       // unit weight, not 1 liter
  eq('1 lata', 350);          // household measure, not 1 liter
  eq('2 latas de coca', 700);
  eq('500 ml', 500);          // real volume still works
  eq('1 litro de leite', 1000);
  eq('150 gramas', 150);      // mass still works
  eq('200g de arroz', 200);
  console.log('units self-check ok');
}

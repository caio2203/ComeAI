/**
 * Offline TACO lookup with fuzzy search.
 *
 * Loads the bundled TACO mini dataset and exposes a `lookup(name)` API
 * backed by Fuse.js. A high-confidence hit here skips any network call
 * (Open Food Facts or Gemini estimation), which is the whole point of
 * shipping the table offline.
 *
 * Exports: lookup, scaleNutrients, getAll
 */

import Fuse from 'fuse.js';
import dataset from '../data/taco-mini.json';
import { normalize } from './format.js';

/** @typedef {(typeof dataset)['items'][number]} TacoItem */

// Tuned by hand against ~30 common Brazilian queries. 0.45 threshold ignores
// matches that are barely related (e.g. "queijo" vs "queijo branco" still
// hits, but "biscoito" doesn't match "bisteca").
const fuse = new Fuse(dataset.items, {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'aliases', weight: 1 },
  ],
  threshold: 0.45,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 3,
});

/**
 * @typedef {object} TacoLookupResult
 * @property {TacoItem} item
 * @property {number} confidence       0..1 — derived from Fuse score (1 - score).
 */

/**
 * @description Fuzzy-search a food by name against the bundled TACO mini
 *   dataset. Returns null when no entry is close enough.
 * @param {string} name
 * @returns {TacoLookupResult | null}
 */
export function lookup(name) {
  const q = normalize(name);
  if (!q) return null;
  const [best] = fuse.search(q, { limit: 1 });
  if (!best) return null;
  // Fuse score: 0 = perfect, 1 = no match. Invert into our 0..1 confidence.
  const confidence = 1 - best.score;
  return { item: best.item, confidence };
}

/**
 * @description Scale a per-100g TACO entry to an arbitrary serving size.
 *   Pure function — does not mutate the entry.
 * @param {TacoItem} item
 * @param {number} grams
 * @returns {{ kcal:number, protein:number, carbs:number, fat:number, fiber:number }}
 */
export function scaleNutrients(item, grams) {
  const k = grams / 100;
  return {
    kcal: item.kcal * k,
    protein: item.protein * k,
    carbs: item.carbs * k,
    fat: item.fat * k,
    fiber: (item.fiber ?? 0) * k,
  };
}

/** @description Full bundled dataset — exposed for autocomplete UIs. */
export function getAll() {
  return dataset.items;
}

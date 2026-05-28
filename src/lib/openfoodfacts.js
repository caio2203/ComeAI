/**
 * Open Food Facts client — branded/packaged product lookup.
 *
 * Used as the *second* step of the nutrition cascade (TACO → OFF → Gemini).
 * Targets products like "Toddy", "Whey Optimum Gold" — things TACO doesn't
 * cover. Responses are cached in IndexedDB so the second lookup is instant
 * and works offline.
 *
 * OFF v2 docs: https://wiki.openfoodfacts.org/Open_Food_Facts_API_v2
 *
 * Exports: searchByName, getByBarcode
 */

import { get, set, createStore } from 'idb-keyval';

const store = createStore('athletetrack', 'off-cache');

const BASE = 'https://world.openfoodfacts.org';
const HEADERS = {
  // OFF asks consumers to identify themselves; this string is informational only.
  'User-Agent': 'AthleteTrack-PWA/0.1 (https://github.com/caio2203/ComeAI)',
};

/**
 * @typedef {object} OffResult
 * @property {string} name
 * @property {string} [brand]
 * @property {string} [code]               barcode
 * @property {{kcal:number,protein:number,carbs:number,fat:number}} per100g
 * @property {string} [imageUrl]
 * @property {number} confidence            0..1, higher when nutriments are complete
 */

function pickPer100g(nutriments) {
  // OFF returns numbers in two units. Prefer kcal; fall back to kJ ÷ 4.184.
  // Gracefully degrade — missing fields become 0 so totals still add up.
  const kcal =
    Number(nutriments?.['energy-kcal_100g']) ||
    (Number(nutriments?.['energy-kj_100g']) ? Number(nutriments['energy-kj_100g']) / 4.184 : 0);
  return {
    kcal,
    protein: Number(nutriments?.['proteins_100g']) || 0,
    carbs: Number(nutriments?.['carbohydrates_100g']) || 0,
    fat: Number(nutriments?.['fat_100g']) || 0,
  };
}

function scoreCompleteness(per100g) {
  // 0.4 baseline + 0.15 per macro present, capped at 1.0.
  const filled = ['kcal', 'protein', 'carbs', 'fat'].filter((k) => per100g[k] > 0).length;
  return Math.min(1, 0.4 + filled * 0.15);
}

/**
 * @description Search OFF by free-text product name. Returns the best
 *   candidate or null. Results are cached for 30 days per query.
 * @param {string} query
 * @returns {Promise<OffResult | null>}
 */
export async function searchByName(query) {
  const q = (query || '').trim();
  if (!q) return null;
  const cacheKey = `q:${q.toLowerCase()}`;

  const cached = await get(cacheKey, store);
  // 30-day TTL — packaged-product nutrition labels rarely change faster than that.
  if (cached && Date.now() - cached.cachedAt < 30 * 86400000) return cached.value;

  try {
    const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=1`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const json = await res.json();
    const product = json?.products?.[0];
    if (!product) {
      await set(cacheKey, { value: null, cachedAt: Date.now() }, store);
      return null;
    }
    const per100g = pickPer100g(product.nutriments);
    const result = {
      name: product.product_name || product.generic_name || q,
      brand: product.brands,
      code: product.code,
      per100g,
      imageUrl: product.image_thumb_url,
      confidence: scoreCompleteness(per100g),
    };
    await set(cacheKey, { value: result, cachedAt: Date.now() }, store);
    return result;
  } catch {
    // Network error — caller (engine) will fall through to Gemini estimation.
    return null;
  }
}

/**
 * @description Lookup OFF by EAN/UPC barcode. Useful for scanner integration
 *   in a later phase. Cached for 30 days.
 * @param {string} code
 * @returns {Promise<OffResult | null>}
 */
export async function getByBarcode(code) {
  const c = (code || '').trim();
  if (!c) return null;
  const cacheKey = `b:${c}`;
  const cached = await get(cacheKey, store);
  if (cached && Date.now() - cached.cachedAt < 30 * 86400000) return cached.value;

  try {
    const res = await fetch(`${BASE}/api/v2/product/${encodeURIComponent(c)}.json`, { headers: HEADERS });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.status !== 1) {
      await set(cacheKey, { value: null, cachedAt: Date.now() }, store);
      return null;
    }
    const p = json.product;
    const per100g = pickPer100g(p.nutriments);
    const result = {
      name: p.product_name || p.generic_name || c,
      brand: p.brands,
      code: p.code,
      per100g,
      imageUrl: p.image_thumb_url,
      confidence: scoreCompleteness(per100g),
    };
    await set(cacheKey, { value: result, cachedAt: Date.now() }, store);
    return result;
  } catch {
    return null;
  }
}

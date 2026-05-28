/**
 * IndexedDB persistence for meals (and any heavy cached data later).
 * Wraps `idb-keyval` with a per-day key layout so the diary can load only
 * the requested day instead of the whole history.
 *
 * Key layout:
 *   meals:index            → string[] of YYYY-MM-DD dates with entries
 *   meals:day:YYYY-MM-DD   → MealEntry[]
 *
 * Exports: listDays, getDay, saveMeal, updateMeal, deleteMeal, getTotalsForDay,
 *          exportAll, importAll, clearAll
 */

import { get, set, del, createStore } from 'idb-keyval';

const store = createStore('athletetrack', 'kv');

const INDEX_KEY = 'meals:index';
const dayKey = (iso) => `meals:day:${iso}`;

/**
 * @typedef {object} FoodItem
 * @property {string} name
 * @property {string} [quantityText]      "100 g", "1 colher de sopa"
 * @property {number} grams
 * @property {number} kcal
 * @property {number} protein             grams
 * @property {number} carbs               grams
 * @property {number} fat                 grams
 * @property {'taco'|'off'|'gemini'|'manual'} source
 * @property {number} confidence          0..1
 * @property {string} [tacoId]
 * @property {string} [offCode]
 */

/**
 * @typedef {object} MealEntry
 * @property {string} id                  uuid
 * @property {number} timestamp           ms since epoch
 * @property {'cafe'|'pre'|'almoco'|'pos'|'jantar'|'lanche'} mealType
 * @property {string} rawDescription      what the user typed/spoke
 * @property {FoodItem[]} items
 * @property {{kcal:number,protein:number,carbs:number,fat:number}} totals
 */

/**
 * @description Convert a Date (or "now") to local YYYY-MM-DD. Diary is bucketed
 *   by the user's local date so a meal logged at 23:50 stays in today's day.
 * @param {Date|number} [d]
 * @returns {string}
 */
export function toLocalISODate(d = new Date()) {
  const date = typeof d === 'number' ? new Date(d) : d;
  const tz = date.getTimezoneOffset();
  return new Date(date.getTime() - tz * 60000).toISOString().slice(0, 10);
}

async function readIndex() {
  return (await get(INDEX_KEY, store)) || [];
}

async function writeIndex(arr) {
  await set(INDEX_KEY, arr, store);
}

/**
 * @description List every day that has at least one meal entry.
 * @returns {Promise<string[]>}
 */
export async function listDays() {
  return readIndex();
}

/**
 * @description Get all meal entries for a given day.
 * @param {string} iso  YYYY-MM-DD
 * @returns {Promise<MealEntry[]>}
 */
export async function getDay(iso) {
  return (await get(dayKey(iso), store)) || [];
}

/**
 * @description Append a new meal entry to its day. Maintains the day index.
 * @param {MealEntry} entry
 */
export async function saveMeal(entry) {
  const iso = toLocalISODate(entry.timestamp);
  const day = await getDay(iso);
  day.push(entry);
  await set(dayKey(iso), day, store);

  const idx = await readIndex();
  if (!idx.includes(iso)) {
    idx.push(iso);
    idx.sort();
    await writeIndex(idx);
  }
}

/**
 * @description Replace an existing meal entry (same id) in its day bucket.
 * @param {MealEntry} entry
 */
export async function updateMeal(entry) {
  const iso = toLocalISODate(entry.timestamp);
  const day = await getDay(iso);
  const i = day.findIndex((m) => m.id === entry.id);
  if (i < 0) return saveMeal(entry);
  day[i] = entry;
  await set(dayKey(iso), day, store);
}

/**
 * @description Remove a meal entry. Also removes the day from the index when
 *   the bucket becomes empty.
 * @param {string} iso
 * @param {string} id
 */
export async function deleteMeal(iso, id) {
  const day = await getDay(iso);
  const next = day.filter((m) => m.id !== id);
  if (next.length === 0) {
    await del(dayKey(iso), store);
    const idx = (await readIndex()).filter((d) => d !== iso);
    await writeIndex(idx);
  } else {
    await set(dayKey(iso), next, store);
  }
}

/**
 * @description Sum macros across every meal in a day.
 * @param {string} iso
 * @returns {Promise<{kcal:number,protein:number,carbs:number,fat:number}>}
 */
export async function getTotalsForDay(iso) {
  const day = await getDay(iso);
  return day.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.totals.kcal,
      protein: acc.protein + m.totals.protein,
      carbs: acc.carbs + m.totals.carbs,
      fat: acc.fat + m.totals.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/**
 * @description Shift a local ISO date by N days (positive or negative). Used
 *   by the diary's day navigation arrows. Operates on string→string so we
 *   never accidentally drift across DST when crossing midnight.
 * @param {string} iso  YYYY-MM-DD
 * @param {number} delta
 * @returns {string}
 */
export function shiftISO(iso, delta) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toLocalISODate(dt);
}

/**
 * @description Dump every day's meals to a serializable object (used by the
 *   Profile → "Export JSON" flow in Phase 7).
 * @returns {Promise<{days: Record<string, MealEntry[]>}>}
 */
export async function exportAll() {
  const days = await listDays();
  const out = {};
  for (const d of days) out[d] = await getDay(d);
  return { days: out };
}

/**
 * @description Bulk-write days from an exported payload (Profile → "Importar").
 *   Merges: each day in the payload overwrites that day's bucket and joins the
 *   index, but days absent from the payload stay untouched — an import never
 *   silently drops history already on the device.
 * @param {{days: Record<string, MealEntry[]>}} payload
 * @returns {Promise<number>} how many days were written
 */
export async function importAll(payload) {
  const days = payload?.days || {};
  const isos = Object.keys(days);
  for (const iso of isos) await set(dayKey(iso), days[iso], store);
  const idx = await readIndex();
  await writeIndex(Array.from(new Set([...idx, ...isos])).sort());
  return isos.length;
}

/**
 * @description Delete every meal day and the index. Used by Profile →
 *   "Apagar tudo". Hydration and settings are wiped by their own modules.
 */
export async function clearAll() {
  const idx = await readIndex();
  for (const iso of idx) await del(dayKey(iso), store);
  await del(INDEX_KEY, store);
}

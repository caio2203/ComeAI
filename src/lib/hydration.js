/**
 * Hydration persistence + daily-target math (Phase 5).
 *
 * Mirrors the meal storage layout in db.js so day navigation stays uniform:
 *   hydration:index            → string[] of YYYY-MM-DD with at least one entry
 *   hydration:day:YYYY-MM-DD   → WaterEntry[]
 *
 * Default daily target = round(35 ml × bodyweight / 50) × 50, clamped to
 * [1500, 4500] ml (FAO/EFSA reference, smoothed to the nearest 50 ml so the
 * "Faltam X ml" copy is readable). Falls back to 2500 ml when weight is
 * unknown. A user-defined override (`profile.waterTargetMl`) wins over both.
 *
 * Exports: addEntry, removeEntry, getDay, getTotalForDay, listDays,
 *          dailyTarget, exportAll, importAll, clearAll, MIN_TARGET_ML,
 *          MAX_TARGET_ML, DEFAULT_TARGET_ML, PER_KG_ML
 */

import { get, set, del, createStore } from 'idb-keyval';
import { toLocalISODate } from './db.js';
import { uuid } from './format.js';

const store = createStore('comeai', 'kv');

const INDEX_KEY = 'hydration:index';
const dayKey = (iso) => `hydration:day:${iso}`;

export const MIN_TARGET_ML = 1500;
export const MAX_TARGET_ML = 4500;
export const DEFAULT_TARGET_ML = 2500;
export const PER_KG_ML = 35;

/**
 * @typedef {object} WaterEntry
 * @property {string} id
 * @property {number} timestamp  ms since epoch
 * @property {number} ml
 */

async function readIndex() {
  return (await get(INDEX_KEY, store)) || [];
}

async function writeIndex(arr) {
  await set(INDEX_KEY, arr, store);
}

/** @description Every day that has at least one water entry. */
export async function listDays() {
  return readIndex();
}

/** @description All water entries for a day, in chronological order. */
export async function getDay(iso) {
  return (await get(dayKey(iso), store)) || [];
}

/**
 * @description Append a water entry. Bucketed by the local day of `when` so
 *   a glass logged at 23:50 stays in today's total.
 * @param {number} ml       positive integer
 * @param {number|Date} [when]
 * @returns {Promise<WaterEntry>}
 */
export async function addEntry(ml, when = Date.now()) {
  const ts = typeof when === 'number' ? when : when.getTime();
  const iso = toLocalISODate(ts);
  const entry = { id: uuid(), timestamp: ts, ml: Math.round(ml) };
  const day = await getDay(iso);
  day.push(entry);
  await set(dayKey(iso), day, store);
  const idx = await readIndex();
  if (!idx.includes(iso)) {
    idx.push(iso);
    idx.sort();
    await writeIndex(idx);
  }
  return entry;
}

/**
 * @description Remove an entry. Drops the day from the index when its bucket
 *   becomes empty, mirroring `deleteMeal` in db.js.
 */
export async function removeEntry(iso, id) {
  const day = await getDay(iso);
  const next = day.filter((e) => e.id !== id);
  if (next.length === 0) {
    await del(dayKey(iso), store);
    const idx = (await readIndex()).filter((d) => d !== iso);
    await writeIndex(idx);
  } else {
    await set(dayKey(iso), next, store);
  }
}

/** @description Sum of ml across every entry of a day. */
export async function getTotalForDay(iso) {
  const day = await getDay(iso);
  return day.reduce((sum, e) => sum + e.ml, 0);
}

/**
 * @description Dump every water day to a serializable object, mirroring
 *   `exportAll` in db.js so the backup payload stays uniform.
 * @returns {Promise<{days: Record<string, WaterEntry[]>}>}
 */
export async function exportAll() {
  const days = await listDays();
  const out = {};
  for (const d of days) out[d] = await getDay(d);
  return { days: out };
}

/**
 * @description Bulk-write water days from a backup. Merge semantics, identical
 *   to db.js `importAll`.
 * @param {{days: Record<string, WaterEntry[]>}} payload
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

/** @description Delete every water day and the index (Profile → "Apagar tudo"). */
export async function clearAll() {
  const idx = await readIndex();
  for (const iso of idx) await del(dayKey(iso), store);
  await del(INDEX_KEY, store);
}

/**
 * @description Recommended daily fluid intake. An explicit override always
 *   wins; otherwise compute from bodyweight; fall back to a sane default.
 * @param {{weightKg?: number, override?: number}} [args]
 * @returns {number} ml
 */
export function dailyTarget({ weightKg, override } = {}) {
  if (override && override > 0) return Math.max(MIN_TARGET_ML, Math.min(MAX_TARGET_ML, Math.round(override)));
  if (!weightKg || weightKg <= 0) return DEFAULT_TARGET_ML;
  const raw = Math.round((weightKg * PER_KG_ML) / 50) * 50;
  return Math.max(MIN_TARGET_ML, Math.min(MAX_TARGET_ML, raw));
}

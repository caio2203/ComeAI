/**
 * Tiny formatting helpers used across the AI/diary UI.
 *
 * Exports: kcal, g, pct, round1, uuid, normalize, kcalFromMacros
 */

/** @description Round to 1 decimal place. */
export const round1 = (n) => Math.round(n * 10) / 10;

/** @description "1.234 kcal" with pt-BR thousands separator. */
export const kcal = (n) => `${Math.round(n).toLocaleString('pt-BR')} kcal`;

/** @description "12,5 g" — pt-BR decimal comma. */
export const g = (n) => `${round1(n).toString().replace('.', ',')} g`;

/** @description "0 / 2500" → "0%" — defensive against div-by-zero. */
export const pct = (value, target) => (target > 0 ? Math.min(100, (value / target) * 100) : 0);

/**
 * @description Crockford-style uuid that works without crypto.randomUUID
 *   (Safari < 15 still ships in the wild). Collision risk is negligible for
 *   a single-user PWA.
 * @returns {string}
 */
export const uuid = () =>
  globalThis.crypto?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

/**
 * @description Lowercase, strip accents and collapse whitespace — used as the
 *   normalized key for fuzzy food lookups (TACO + Open Food Facts).
 * @param {string} s
 * @returns {string}
 */
export const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * @description Atwater factors: 4 kcal/g protein and carb, 9 kcal/g fat.
 *   Used as a sanity-check / fallback when only macros are known.
 * @param {{protein:number,carbs:number,fat:number}} m
 * @returns {number}
 */
export const kcalFromMacros = ({ protein, carbs, fat }) =>
  protein * 4 + carbs * 4 + fat * 9;

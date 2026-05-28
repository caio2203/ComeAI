/**
 * Local-only user settings. Stores the Gemini API key, model id and
 * lightweight user profile in localStorage. There is no backend, so this
 * is the durable source of truth.
 *
 * Exports: getApiKey, setApiKey, getModel, setModel, getProfile, setProfile,
 *          hasGemini, clearSettings
 */

const NS = 'athletetrack:settings';
const KEY_API = `${NS}:gemini-key`;
const KEY_MODEL = `${NS}:gemini-model`;
const KEY_PROFILE = `${NS}:profile`;

const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * @description Read the user's Gemini API key (empty string if unset).
 * @returns {string}
 */
export function getApiKey() {
  try {
    return localStorage.getItem(KEY_API) || '';
  } catch {
    return '';
  }
}

/**
 * @description Persist (or clear) the Gemini API key.
 * @param {string} key - The API key. Pass an empty string to remove it.
 */
export function setApiKey(key) {
  if (!key) localStorage.removeItem(KEY_API);
  else localStorage.setItem(KEY_API, key.trim());
}

/**
 * @description Get the configured Gemini model id (defaults to gemini-2.0-flash).
 * @returns {string}
 */
export function getModel() {
  return localStorage.getItem(KEY_MODEL) || DEFAULT_MODEL;
}

/**
 * @description Override the Gemini model id (e.g. "gemini-1.5-flash").
 * @param {string} model
 */
export function setModel(model) {
  if (!model) localStorage.removeItem(KEY_MODEL);
  else localStorage.setItem(KEY_MODEL, model);
}

/**
 * @typedef {object} Profile
 * @property {string} [name]
 * @property {number} [weightKg]
 * @property {number} [heightCm]
 * @property {number} [age]
 * @property {'m'|'f'} [sex]
 * @property {'sedentary'|'light'|'moderate'|'active'|'very_active'} [activity]
 * @property {'cutting'|'maintenance'|'bulk'} [goal]
 * @property {number} [kcalTarget]
 * @property {number} [proteinTarget]
 * @property {number} [carbsTarget]
 * @property {number} [fatTarget]
 */

/**
 * @description Read the persisted user profile.
 * @returns {Profile}
 */
export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(KEY_PROFILE) || '{}');
  } catch {
    return {};
  }
}

/**
 * @description Persist the user profile (merged with existing).
 * @param {Partial<Profile>} patch
 * @returns {Profile} the new profile after merge
 */
export function setProfile(patch) {
  const next = { ...getProfile(), ...patch };
  localStorage.setItem(KEY_PROFILE, JSON.stringify(next));
  return next;
}

/** @description True if a Gemini API key is configured. */
export function hasGemini() {
  return !!getApiKey();
}

/** @description Wipe every setting. Used by Profile → "Reset". */
export function clearSettings() {
  localStorage.removeItem(KEY_API);
  localStorage.removeItem(KEY_MODEL);
  localStorage.removeItem(KEY_PROFILE);
}

/**
 * Full local backup (Phase 7). Assembles every store into one JSON blob,
 * restores from a file, and wipes the device.
 *
 * Security: the Gemini API key is deliberately excluded from the export. Per
 * the project rule it lives only in `localStorage` and must never land in a
 * file that could be shared, synced or attached. The chosen model id (not a
 * secret) is included so a restore keeps the user's preference.
 *
 * Restore uses merge semantics (see db.js / hydration.js `importAll`): days in
 * the file overwrite their buckets, days only on the device are kept.
 *
 * Exports: buildBackup, downloadBackup, readBackupFile, restoreBackup,
 *          wipeEverything, BACKUP_VERSION
 */

import {
  exportAll as exportMeals,
  importAll as importMeals,
  clearAll as clearMeals,
  toLocalISODate,
} from './db.js';
import {
  exportAll as exportWater,
  importAll as importWater,
  clearAll as clearWater,
} from './hydration.js';
import { getProfile, setProfile, getModel, setModel, clearSettings } from './settings.js';

export const BACKUP_VERSION = 1;
const APP_TAG = 'athletetrack-backup';

/**
 * @description Assemble the full backup object (no API key).
 * @returns {Promise<object>}
 */
export async function buildBackup() {
  const [meals, hydration] = await Promise.all([exportMeals(), exportWater()]);
  return {
    app: APP_TAG,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    model: getModel(),
    meals,
    hydration,
  };
}

/**
 * @description Build the backup and trigger a file download. Filename carries
 *   the local date so multiple exports sort naturally.
 * @returns {Promise<string>} the ISO timestamp written into the file
 */
export async function downloadBackup() {
  const data = await buildBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `athletetrack-${toLocalISODate()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return data.exportedAt;
}

/**
 * @description Read and parse a user-selected backup file.
 * @param {File} file
 * @returns {Promise<object>} parsed JSON
 * @throws if the file is not valid JSON
 */
export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)));
      } catch {
        reject(new Error('Arquivo nao e um JSON valido.'));
      }
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsText(file);
  });
}

/**
 * @description Restore a parsed backup into every store. Validates the app tag
 *   so a random JSON cannot clobber the user's data.
 * @param {object} parsed  output of readBackupFile
 * @returns {Promise<{mealDays:number, waterDays:number}>}
 * @throws if the payload is not an AthleteTrack backup
 */
export async function restoreBackup(parsed) {
  if (!parsed || parsed.app !== APP_TAG) {
    throw new Error('Arquivo nao reconhecido como backup do AthleteTrack.');
  }
  if (parsed.profile && typeof parsed.profile === 'object') setProfile(parsed.profile);
  if (parsed.model) setModel(parsed.model);
  const [mealDays, waterDays] = await Promise.all([
    importMeals(parsed.meals || { days: {} }),
    importWater(parsed.hydration || { days: {} }),
  ]);
  return { mealDays, waterDays };
}

/**
 * @description Nuke everything: meals, hydration and all settings (including
 *   the Gemini key). Irreversible — the UI guards it behind a confirmation.
 */
export async function wipeEverything() {
  await Promise.all([clearMeals(), clearWater()]);
  clearSettings();
}

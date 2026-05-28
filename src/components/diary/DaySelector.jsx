/**
 * Day navigation header. Lets the user step back through previous days and
 * jump straight back to today. Next-day arrow is hidden when already on today.
 *
 * Exports: DaySelector (default), formatDayLabel
 */

import { motion } from 'framer-motion';
import { shiftISO, toLocalISODate } from '../../lib/db.js';

/**
 * @description Friendly pt-BR label for a date string. Uses "Hoje" / "Ontem"
 *   for the two closest days; falls back to "qua, 28 de mai" otherwise.
 * @param {string} iso  YYYY-MM-DD
 */
export function formatDayLabel(iso) {
  const today = toLocalISODate();
  if (iso === today) return 'Hoje';
  if (iso === shiftISO(today, -1)) return 'Ontem';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

/**
 * @param {object} props
 * @param {string} props.iso
 * @param {(next: string) => void} props.onChange
 */
export default function DaySelector({ iso, onChange }) {
  const today = toLocalISODate();
  const isFuture = iso >= today;

  return (
    <div className="flex items-center justify-between px-1 mb-3">
      <button
        onClick={() => onChange(shiftISO(iso, -1))}
        aria-label="Dia anterior"
        className="w-10 h-10 rounded-2xl bg-bg-card border border-white/5 flex items-center justify-center text-white/70 active:bg-white/5"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path strokeLinecap="round" d="M15 6l-6 6 6 6" />
        </svg>
      </button>

      <div className="flex flex-col items-center">
        <p className="text-sm font-bold">{formatDayLabel(iso)}</p>
        {iso !== today && (
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onChange(today)}
            className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider"
          >
            Voltar para hoje
          </motion.button>
        )}
      </div>

      <button
        disabled={isFuture}
        onClick={() => !isFuture && onChange(shiftISO(iso, 1))}
        aria-label="Próximo dia"
        className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-opacity ${
          isFuture
            ? 'bg-transparent border-transparent text-transparent'
            : 'bg-bg-card border-white/5 text-white/70 active:bg-white/5'
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path strokeLinecap="round" d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}

/**
 * List of water entries for a single day, with swipe-to-delete.
 *
 * Same Framer Motion drag pattern as `MealCard` (commit at offset < −60 px
 * OR velocity < −400 px/s). Keeps gestural language consistent between the
 * Diary and the Hydration screens.
 *
 * Exports: EntryList (default)
 */

import { motion, useMotionValue } from 'framer-motion';

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/**
 * @param {object} props
 * @param {import('../../lib/hydration.js').WaterEntry[]} props.entries
 * @param {(id:string) => void} props.onDelete
 */
export default function EntryList({ entries, onDelete }) {
  if (!entries.length) {
    return (
      <div className="rounded-2xl bg-bg-card border border-dashed border-white/10 p-5 text-center">
        <p className="text-sm text-white/55">Nenhum registro neste dia.</p>
        <p className="text-[11px] text-white/35 mt-1">Toque em um botão acima para começar.</p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="rounded-2xl bg-bg-card border border-white/5 overflow-hidden">
      {sorted.map((e, i) => (
        <Row
          key={e.id}
          entry={e}
          isLast={i === sorted.length - 1}
          onDelete={() => onDelete(e.id)}
        />
      ))}
    </div>
  );
}

function Row({ entry, isLast, onDelete }) {
  // Mirror MealCard's proven swipe: a bound motion value we reset on release.
  // No `layout`/height-exit/dragSnapToOrigin here — that combo fought the drag
  // transform and froze the list on delete.
  const x = useMotionValue(0);

  return (
    <div className={`relative ${isLast ? '' : 'border-b border-white/5'}`}>
      <div className="absolute inset-y-0 right-0 w-28 flex items-center justify-center bg-protein/15">
        <span className="text-[11px] font-bold text-protein uppercase tracking-wider">Apagar</span>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.05, right: 0 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60 || info.velocity.x < -400) onDelete();
          else x.set(0);
        }}
        // `relative` keeps the row painted above the "Apagar" reveal — without it
        // the absolute overlay paints on top and bleeds over the row at rest.
        className="relative flex items-center justify-between gap-3 px-4 py-3 bg-bg-card"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-water/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#60A5FA" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white/90">{entry.ml} ml</p>
            <p className="text-[11px] text-white/45">{formatTime(entry.timestamp)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          // The button sits on the drag surface; stop the pointerdown from
          // starting a drag so the tap stays a clean click and actually deletes.
          onPointerDownCapture={(e) => e.stopPropagation()}
          aria-label="Apagar registro"
          className="w-8 h-8 rounded-lg text-white/35 hover:text-protein active:bg-white/5"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
}

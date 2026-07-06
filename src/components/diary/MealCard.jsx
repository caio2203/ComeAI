/**
 * Swipe-to-delete meal card.
 *
 * Drag horizontally to reveal an Excluir action behind the card. Past −90 px
 * the gesture latches; releasing at ≤ −60 px commits the delete. Anything
 * shorter snaps back to closed.
 *
 * Exports: MealCard (default)
 */

import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { kcal as fmtKcal, g as fmtG } from '../../lib/format.js';
import { sourceLabel } from '../ai/ConfidenceBadge.jsx';

/**
 * @param {object} props
 * @param {import('../../lib/db.js').MealEntry} props.meal
 * @param {() => void} props.onRemove
 */
export default function MealCard({ meal, onRemove }) {
  const x = useMotionValue(0);
  const [expanded, setExpanded] = useState(false);
  const deleteOpacity = useTransform(x, [-90, -20, 0], [1, 0.4, 0]);

  const time = new Date(meal.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      layout
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <motion.div
        aria-hidden
        style={{ opacity: deleteOpacity }}
        className="absolute inset-y-0 right-0 w-24 bg-protein/90 flex flex-col items-center justify-center text-white"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path strokeLinecap="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Excluir</span>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          // Commit delete if released past −60 px OR with strong leftward velocity.
          if (info.offset.x < -60 || info.velocity.x < -400) onRemove();
          else x.set(0);
        }}
        whileTap={{ cursor: 'grabbing' }}
        className="relative rounded-2xl bg-bg-card border border-white/5 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-widest text-brand-400 font-semibold">
              {time}
            </p>
            <p className="text-sm text-white/85 mt-0.5 line-clamp-2">{meal.rawDescription}</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            // Sits on the swipe surface — keep pointerdown from starting a drag
            // so tapping reliably toggles instead of nudging the card.
            onPointerDownCapture={(e) => e.stopPropagation()}
            aria-label={expanded ? 'Recolher itens' : 'Ver itens'}
            className="w-8 h-8 rounded-xl bg-white/5 text-white/60 flex items-center justify-center shrink-0"
          >
            <motion.svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.18 }}
            >
              <path strokeLinecap="round" d="M6 9l6 6 6-6" />
            </motion.svg>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3">
          <Pill label="kcal" value={fmtKcal(meal.totals.kcal)} tone="text-brand-400" />
          <Pill label="P" value={fmtG(meal.totals.protein)} tone="text-protein" />
          <Pill label="C" value={fmtG(meal.totals.carbs)} tone="text-carb" />
          <Pill label="G" value={fmtG(meal.totals.fat)} tone="text-fat" />
        </div>

        <motion.div
          initial={false}
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <ul className="mt-3 space-y-1">
            {meal.items.map((it, i) => (
              <li key={i} className="text-xs text-white/70 flex justify-between gap-2">
                <span className="truncate">
                  {it.name} <span className="text-white/40">· {Math.round(it.grams)} g</span>
                </span>
                <span className="text-white/40 shrink-0 text-[10px]">{sourceLabel(it.source)}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Pill({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-bg-elev border border-white/5 px-2 py-1.5">
      <p className="text-[10px] text-white/45 uppercase tracking-wider">{label}</p>
      <p className={`text-xs font-bold ${tone}`}>{value}</p>
    </div>
  );
}

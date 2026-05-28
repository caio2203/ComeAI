/**
 * Calorie progress ring + macro chips.
 *
 * Single SVG ring (kcal vs target) with the consumed kcal in the center.
 * P/C/G are surfaced as compact chips underneath because three concentric
 * rings on a 480px viewport became unreadable at the chip-sized labels.
 *
 * Exports: MacroRing (default)
 */

import { motion } from 'framer-motion';
import { pct, kcal as fmtKcal, g as fmtG } from '../../lib/format.js';

const SIZE = 132;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

/**
 * @param {object} props
 * @param {{kcal:number,protein:number,carbs:number,fat:number}} props.totals
 * @param {{kcal:number,protein:number,carbs:number,fat:number}} props.targets
 */
export default function MacroRing({ totals, targets }) {
  const ratio = Math.min(1, totals.kcal / Math.max(1, targets.kcal));
  // dasharray trick: stroke length = ratio × circumference, gap fills the rest.
  const dash = ratio * CIRC;

  return (
    <div className="rounded-2xl bg-bg-card border border-white/5 p-4">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={STROKE}
              fill="none"
            />
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="url(#ringGrad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRC}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: CIRC - dash }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-extrabold leading-none">{Math.round(totals.kcal)}</p>
            <p className="text-[10px] text-white/45 mt-1 uppercase tracking-widest">/ {Math.round(targets.kcal)} kcal</p>
            <p className="text-[10px] text-brand-400 font-bold mt-0.5">{Math.round(pct(totals.kcal, targets.kcal))}%</p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <MacroChip
            label="Proteínas"
            value={totals.protein}
            target={targets.protein}
            color="bg-protein"
            text="text-protein"
            display={fmtG(totals.protein)}
            targetDisplay={fmtG(targets.protein)}
          />
          <MacroChip
            label="Carbos"
            value={totals.carbs}
            target={targets.carbs}
            color="bg-carb"
            text="text-carb"
            display={fmtG(totals.carbs)}
            targetDisplay={fmtG(targets.carbs)}
          />
          <MacroChip
            label="Gorduras"
            value={totals.fat}
            target={targets.fat}
            color="bg-fat"
            text="text-fat"
            display={fmtG(totals.fat)}
            targetDisplay={fmtG(targets.fat)}
          />
        </div>
      </div>
    </div>
  );
}

function MacroChip({ label, value, target, color, text, display, targetDisplay }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className={`font-semibold ${text}`}>{label}</span>
        <span className="text-white/55">
          {display} <span className="text-white/30">/ {targetDisplay}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct(value, target)}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}

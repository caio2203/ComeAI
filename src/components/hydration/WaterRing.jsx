/**
 * Hydration progress ring.
 *
 * Same SVG technique as MacroRing (single `strokeDasharray` circle animated
 * via `strokeDashoffset`) so the design language stays uniform across the
 * Diary and the Hydration page. Larger diameter (180 px) than MacroRing
 * because it is the only visualisation on its screen, not a row component.
 *
 * Exports: WaterRing (default)
 */

import { motion } from 'framer-motion';

const SIZE = 180;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const formatMl = (ml) => ml.toLocaleString('pt-BR');

/**
 * @param {object} props
 * @param {number} props.totalMl
 * @param {number} props.targetMl
 */
export default function WaterRing({ totalMl, targetMl }) {
  const ratio = Math.min(1, totalMl / Math.max(1, targetMl));
  const dash = ratio * CIRC;
  const remaining = Math.max(0, targetMl - totalMl);
  const reached = totalMl >= targetMl;

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="rgba(96,165,250,0.10)"
          strokeWidth={STROKE}
          fill="none"
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="url(#waterGrad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: CIRC - dash }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-extrabold leading-none text-water">
          {formatMl(totalMl)}
          <span className="text-base font-bold text-water/70 ml-1">ml</span>
        </p>
        <p className="text-[10px] text-white/45 mt-2 uppercase tracking-widest">
          / {formatMl(targetMl)} ml
        </p>
        <p
          className={`text-[11px] font-bold mt-1 ${
            reached ? 'text-brand-400' : 'text-water/85'
          }`}
        >
          {reached ? 'Meta atingida' : `Faltam ${formatMl(remaining)} ml`}
        </p>
      </div>
    </div>
  );
}

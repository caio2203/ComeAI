/**
 * Three preset quick-add buttons (150 / 250 / 500 ml).
 *
 * Each button is a tap target with `whileTap` scale feedback. The labels map
 * to the three most common household servings in pt-BR:
 *   150 ml = copo de água pequeno
 *   250 ml = copo médio / squeeze
 *   500 ml = garrafa
 *
 * Exports: QuickAdd (default), PRESETS
 */

import { motion } from 'framer-motion';

export const PRESETS = [
  { ml: 150, label: 'Copo', sub: '150 ml' },
  { ml: 250, label: 'Copo grande', sub: '250 ml' },
  { ml: 500, label: 'Garrafa', sub: '500 ml' },
];

/**
 * @param {object} props
 * @param {(ml:number) => void} props.onAdd
 */
export default function QuickAdd({ onAdd }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PRESETS.map((p) => (
        <motion.button
          key={p.ml}
          whileTap={{ scale: 0.94 }}
          onClick={() => onAdd(p.ml)}
          className="flex flex-col items-center justify-center gap-1 h-20 rounded-2xl bg-bg-card border border-white/5 active:bg-water/5 active:border-water/40"
        >
          <DropIcon ml={p.ml} />
          <span className="text-[11px] font-bold text-white/85">{p.label}</span>
          <span className="text-[10px] text-water/85 font-semibold">+{p.sub}</span>
        </motion.button>
      ))}
    </div>
  );
}

/**
 * @description SVG droplet sized roughly by the preset, so 500 ml looks more
 *   substantial than 150 ml. Pure decoration — not load-bearing data.
 */
function DropIcon({ ml }) {
  const size = ml === 500 ? 22 : ml === 250 ? 18 : 15;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z" />
    </svg>
  );
}

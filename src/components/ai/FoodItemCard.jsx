/**
 * Editable food item card used on the confirmation screen. The user can:
 *   - adjust the gram amount (slider + numeric input — macros rescale live)
 *   - delete the item from the meal
 *
 * Exports: FoodItemCard (default)
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import ConfidenceBadge from './ConfidenceBadge.jsx';
import { kcal as fmtKcal, g as fmtG } from '../../lib/format.js';

/**
 * @param {object} props
 * @param {import('../../lib/db.js').FoodItem} props.item
 * @param {(next: import('../../lib/db.js').FoodItem) => void} props.onChange
 * @param {() => void} props.onRemove
 */
export default function FoodItemCard({ item, onChange, onRemove }) {
  const ratios = useMemo(() => {
    // Cache per-gram macros so slider movement is O(1).
    const k = item.grams || 1;
    return {
      kcal: item.kcal / k,
      protein: item.protein / k,
      carbs: item.carbs / k,
      fat: item.fat / k,
    };
  }, [item.grams, item.kcal, item.protein, item.carbs, item.fat]);

  const setGrams = (grams) => {
    const next = Math.max(1, Math.round(grams));
    onChange({
      ...item,
      grams: next,
      kcal: ratios.kcal * next,
      protein: ratios.protein * next,
      carbs: ratios.carbs * next,
      fat: ratios.fat * next,
      // The user just verified the quantity; bump confidence to 0.9 unless
      // it was already higher (a TACO hit).
      confidence: Math.max(item.confidence ?? 0, 0.9),
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className="rounded-2xl bg-bg-elev border border-white/5 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] leading-tight truncate">{item.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <ConfidenceBadge confidence={item.confidence} source={item.source} />
            {item.quantityText && (
              <span className="text-[11px] text-white/45 truncate">"{item.quantityText}"</span>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          aria-label="Remover item"
          className="w-8 h-8 rounded-xl bg-white/5 text-white/50 active:bg-protein/30 active:text-protein flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        <Macro label="kcal" value={fmtKcal(item.kcal)} tone="text-brand-400" />
        <Macro label="P" value={fmtG(item.protein)} tone="text-protein" />
        <Macro label="C" value={fmtG(item.carbs)} tone="text-carb" />
        <Macro label="G" value={fmtG(item.fat)} tone="text-fat" />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-white/55 mb-1">
          <span>Quantidade</span>
          <span className="text-white/80 font-semibold">{Math.round(item.grams)} g</span>
        </div>
        <input
          type="range"
          min={5}
          max={500}
          step={5}
          value={Math.min(500, Math.round(item.grams))}
          onChange={(e) => setGrams(Number(e.target.value))}
          className="w-full accent-brand-500"
        />
      </div>
    </motion.div>
  );
}

function Macro({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-bg-card border border-white/5 px-2 py-1.5">
      <p className="text-[10px] text-white/45 uppercase tracking-wider">{label}</p>
      <p className={`text-xs font-bold ${tone}`}>{value}</p>
    </div>
  );
}

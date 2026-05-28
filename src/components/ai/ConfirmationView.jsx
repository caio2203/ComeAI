/**
 * Confirmation step of the meal logging flow.
 *
 * Shows the parsed items, lets the user tweak grams or remove items, pick
 * the meal type, and save. Totals at the top update live.
 *
 * Exports: ConfirmationView (default)
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FoodItemCard from './FoodItemCard.jsx';
import { recomputeTotals, persistMeal } from '../../lib/nutritionEngine.js';
import { kcal as fmtKcal, g as fmtG } from '../../lib/format.js';

const MEAL_TYPES = [
  { id: 'cafe', label: 'Café' },
  { id: 'pre', label: 'Pré-treino' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'pos', label: 'Pós-treino' },
  { id: 'jantar', label: 'Jantar' },
  { id: 'lanche', label: 'Lanche' },
];

const guessMealType = () => {
  // Reasonable default based on local clock — atlhetes almost always log
  // a meal "now" rather than backdating it.
  const h = new Date().getHours();
  if (h < 10) return 'cafe';
  if (h < 12) return 'pre';
  if (h < 15) return 'almoco';
  if (h < 17) return 'pos';
  if (h < 21) return 'jantar';
  return 'lanche';
};

/**
 * @param {object} props
 * @param {import('../../lib/db.js').FoodItem[]} props.initialItems
 * @param {string} props.rawDescription
 * @param {(saved: import('../../lib/db.js').MealEntry) => void} props.onSaved
 * @param {() => void} props.onBack - go back to entry step
 * @param {string} [props.warning] - shown as a soft banner (e.g. Gemini fallback)
 */
export default function ConfirmationView({ initialItems, rawDescription, onSaved, onBack, warning }) {
  const [items, setItems] = useState(initialItems);
  const [mealType, setMealType] = useState(guessMealType());
  const [saving, setSaving] = useState(false);
  const totals = useMemo(() => recomputeTotals(items), [items]);

  const updateAt = (i, next) => setItems((arr) => arr.map((it, idx) => (idx === i ? next : it)));
  const removeAt = (i) => setItems((arr) => arr.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!items.length || saving) return;
    setSaving(true);
    try {
      const entry = await persistMeal({ items, rawDescription, mealType });
      onSaved(entry);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-2 pb-3 border-b border-white/5">
        <button onClick={onBack} className="text-xs text-white/55 mb-2 flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" d="M15 6l-6 6 6 6" />
          </svg>
          editar texto
        </button>
        <h2 className="text-lg font-bold">Confira antes de salvar</h2>
        <p className="text-xs text-white/55 mt-0.5">
          Ajuste a quantidade ou remova itens. Os macros atualizam sozinhos.
        </p>
      </div>

      {warning && (
        <div className="mx-5 mt-3 rounded-xl bg-carb/10 border border-carb/30 text-carb text-[11px] px-3 py-2">
          {warning}
        </div>
      )}

      <div className="px-5 mt-3">
        <div className="rounded-2xl bg-bg-elev border border-white/5 p-3 grid grid-cols-4 gap-2">
          <Total label="Total" value={fmtKcal(totals.kcal)} tone="text-brand-400" />
          <Total label="P" value={fmtG(totals.protein)} tone="text-protein" />
          <Total label="C" value={fmtG(totals.carbs)} tone="text-carb" />
          <Total label="G" value={fmtG(totals.fat)} tone="text-fat" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 mt-3 space-y-2.5 pb-4">
        <AnimatePresence initial={false}>
          {items.map((it, i) => (
            <FoodItemCard
              key={`${it.name}-${i}`}
              item={it}
              onChange={(next) => updateAt(i, next)}
              onRemove={() => removeAt(i)}
            />
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <p className="text-center text-white/45 text-sm py-6">
            Sem itens. Volte e descreva a refeição novamente.
          </p>
        )}
      </div>

      <div className="border-t border-white/5 px-5 pt-3 pb-safe">
        <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Tipo de refeição</p>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3">
          {MEAL_TYPES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMealType(m.id)}
              className={`px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                mealType === m.id
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-bg-elev text-white/70 border-white/10'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!items.length || saving}
          onClick={save}
          className="w-full h-12 rounded-2xl bg-brand-500 disabled:bg-white/10 disabled:text-white/40 text-white font-bold"
        >
          {saving ? 'Salvando…' : 'Salvar refeição'}
        </motion.button>
      </div>
    </div>
  );
}

function Total({ label, value, tone }) {
  return (
    <div>
      <p className="text-[10px] text-white/45 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

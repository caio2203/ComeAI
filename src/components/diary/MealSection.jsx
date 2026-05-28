/**
 * Meal-type section header + grouped MealCards.
 *
 * Shows the section sum next to the title so the user can see calories per
 * meal type at a glance ("almoço foi 1200 kcal").
 *
 * Exports: MealSection (default)
 */

import { AnimatePresence } from 'framer-motion';
import MealCard from './MealCard.jsx';
import { kcal as fmtKcal } from '../../lib/format.js';

/**
 * @param {object} props
 * @param {string} props.label - "Almoço", "Pré-treino"…
 * @param {import('../../lib/db.js').MealEntry[]} props.meals
 * @param {(id: string) => void} props.onRemove
 */
export default function MealSection({ label, meals, onRemove }) {
  if (!meals.length) return null;
  const sectionKcal = meals.reduce((a, m) => a + (m.totals?.kcal || 0), 0);

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <h3 className="text-[11px] uppercase tracking-widest text-white/45 font-bold">{label}</h3>
        <span className="text-[11px] text-white/55 font-semibold">{fmtKcal(sectionKcal)}</span>
      </div>
      <AnimatePresence initial={false}>
        {meals.map((m) => (
          <MealCard key={m.id} meal={m} onRemove={() => onRemove(m.id)} />
        ))}
      </AnimatePresence>
    </section>
  );
}

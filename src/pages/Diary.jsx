/**
 * Diary page — full version (Phase 3).
 *
 * Layout (top → bottom):
 *   1. DaySelector (← / today label / →)
 *   2. MacroRing card with kcal ring + P/C/G bars
 *   3. DayDelta vs yesterday
 *   4. MealSection per meal type, swipe-to-delete cards
 *
 * Exports: Diary (default)
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PagePlaceholder from '../components/PagePlaceholder.jsx';
import DaySelector from '../components/diary/DaySelector.jsx';
import MacroRing from '../components/diary/MacroRing.jsx';
import DayDelta from '../components/diary/DayDelta.jsx';
import MealSection from '../components/diary/MealSection.jsx';
import { getDay, getTotalsForDay, toLocalISODate, deleteMeal } from '../lib/db.js';
import { getProfile } from '../lib/settings.js';

const MEAL_ORDER = [
  { id: 'cafe', label: 'Café da manhã' },
  { id: 'pre', label: 'Pré-treino' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'pos', label: 'Pós-treino' },
  { id: 'jantar', label: 'Jantar' },
  { id: 'lanche', label: 'Lanche' },
];

export default function Diary() {
  const [iso, setIso] = useState(toLocalISODate());
  const [meals, setMeals] = useState([]);
  const [totals, setTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const profile = getProfile();

  const targets = useMemo(
    () => ({
      kcal: profile.kcalTarget || 2500,
      protein: profile.proteinTarget || 180,
      carbs: profile.carbsTarget || 280,
      fat: profile.fatTarget || 75,
    }),
    // Profile is stored in localStorage and only changes when the user edits
    // it; recomputing per render is cheap so we skip a useEffect+state dance.
    [profile.kcalTarget, profile.proteinTarget, profile.carbsTarget, profile.fatTarget],
  );

  const refresh = async (date = iso) => {
    const [m, t] = await Promise.all([getDay(date), getTotalsForDay(date)]);
    setMeals(m.sort((a, b) => a.timestamp - b.timestamp));
    setTotals(t);
  };

  useEffect(() => {
    refresh(iso);
  }, [iso]);

  useEffect(() => {
    const onSaved = () => refresh();
    window.addEventListener('comeai:meal-saved', onSaved);
    return () => window.removeEventListener('comeai:meal-saved', onSaved);
    // refresh() reads `iso` via closure of the current render; we rely on the
    // other useEffect (above) to re-fetch when iso changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (id) => {
    await deleteMeal(iso, id);
    refresh(iso);
  };

  // Group by mealType in a single pass so the timeline renders in canonical order.
  const grouped = useMemo(() => {
    const out = Object.fromEntries(MEAL_ORDER.map((t) => [t.id, []]));
    for (const m of meals) {
      if (out[m.mealType]) out[m.mealType].push(m);
      else out['lanche'].push(m);
    }
    return out;
  }, [meals]);

  return (
    <div className="px-5 pt-3 space-y-4 pb-6">
      <DaySelector iso={iso} onChange={setIso} />
      <MacroRing totals={totals} targets={targets} />
      <div className="flex items-center justify-between px-1">
        <DayDelta iso={iso} totalsToday={totals} />
        {!profile.kcalTarget && (
          <span className="text-[10px] text-white/35 uppercase tracking-wider">metas padrão</span>
        )}
      </div>

      {meals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <PagePlaceholder
            title={iso === toLocalISODate() ? 'Sem refeições hoje' : 'Sem refeições neste dia'}
            description="Toque no + central para registrar uma refeição. Descreva por texto ou voz — a IA calcula tudo."
          />
        </motion.div>
      ) : (
        <div className="space-y-5">
          {MEAL_ORDER.map((t) => (
            <MealSection
              key={t.id}
              label={t.label}
              meals={grouped[t.id]}
              onRemove={remove}
            />
          ))}
        </div>
      )}

      {meals.length > 0 && (
        <p className="text-center text-[10px] text-white/35 uppercase tracking-wider pt-2">
          Arraste o card para a esquerda para excluir
        </p>
      )}
    </div>
  );
}

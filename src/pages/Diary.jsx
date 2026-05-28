/**
 * Diary page — minimal version wired to the AI flow.
 *
 * Phase 2 deliverable: shows today's macro totals + list of saved meals.
 * Phase 3 will add: timeline grouped by meal type, swipe-to-delete, FAB
 * shortcuts per meal type, daily comparison.
 *
 * Exports: Diary (default)
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PagePlaceholder from '../components/PagePlaceholder.jsx';
import { getDay, getTotalsForDay, toLocalISODate, deleteMeal } from '../lib/db.js';
import { getProfile } from '../lib/settings.js';
import { kcal as fmtKcal, g as fmtG, pct } from '../lib/format.js';
import { sourceLabel } from '../components/ai/ConfidenceBadge.jsx';

const MEAL_LABELS = {
  cafe: 'Café da manhã',
  pre: 'Pré-treino',
  almoco: 'Almoço',
  pos: 'Pós-treino',
  jantar: 'Jantar',
  lanche: 'Lanche',
};

export default function Diary() {
  const today = toLocalISODate();
  const [meals, setMeals] = useState([]);
  const [totals, setTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const profile = getProfile();

  const refresh = async () => {
    const [m, t] = await Promise.all([getDay(today), getTotalsForDay(today)]);
    setMeals(m.sort((a, b) => a.timestamp - b.timestamp));
    setTotals(t);
  };

  useEffect(() => {
    refresh();
    const onSaved = () => refresh();
    window.addEventListener('athletetrack:meal-saved', onSaved);
    return () => window.removeEventListener('athletetrack:meal-saved', onSaved);
  }, [today]);

  const remove = async (id) => {
    await deleteMeal(today, id);
    refresh();
  };

  return (
    <div className="px-5 pt-4 space-y-4 pb-6">
      <MacroPanel totals={totals} profile={profile} />

      {meals.length === 0 ? (
        <PagePlaceholder
          title="Sem refeições hoje"
          description="Toque no botão central + para registrar a primeira. Descreva por texto ou voz."
        />
      ) : (
        <div className="space-y-2.5">
          {meals.map((m) => (
            <MealCard key={m.id} meal={m} onRemove={() => remove(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MacroPanel({ totals, profile }) {
  // Targets: prefer explicit profile targets; fall back to reasonable athlete
  // defaults so the bars aren't all 0/0 before Phase 4 (TDEE calculator).
  const targets = {
    kcal: profile.kcalTarget || 2500,
    protein: profile.proteinTarget || 180,
    carbs: profile.carbsTarget || 280,
    fat: profile.fatTarget || 75,
  };

  const macros = [
    { label: 'Calorias', value: totals.kcal, target: targets.kcal, color: 'bg-brand-500', display: fmtKcal(totals.kcal), targetDisplay: fmtKcal(targets.kcal) },
    { label: 'Proteínas', value: totals.protein, target: targets.protein, color: 'bg-protein', display: fmtG(totals.protein), targetDisplay: fmtG(targets.protein) },
    { label: 'Carbos', value: totals.carbs, target: targets.carbs, color: 'bg-carb', display: fmtG(totals.carbs), targetDisplay: fmtG(targets.carbs) },
    { label: 'Gorduras', value: totals.fat, target: targets.fat, color: 'bg-fat', display: fmtG(totals.fat), targetDisplay: fmtG(targets.fat) },
  ];

  return (
    <div className="rounded-2xl bg-bg-card border border-white/5 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-white/70">Meta do dia</h2>
        {!profile.kcalTarget && <span className="text-[10px] text-white/40">metas padrão</span>}
      </div>
      <div className="space-y-2.5">
        {macros.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-[11px] text-white/60 mb-1">
              <span>{m.label}</span>
              <span>
                {m.display} / {m.targetDisplay}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct(m.value, m.target)}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`h-full ${m.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MealCard({ meal, onRemove }) {
  const time = new Date(meal.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-2xl bg-bg-card border border-white/5 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-brand-400 font-semibold">
            {MEAL_LABELS[meal.mealType] || meal.mealType} · {time}
          </p>
          <p className="text-sm text-white/85 mt-0.5 line-clamp-2">{meal.rawDescription}</p>
        </div>
        <button
          onClick={onRemove}
          aria-label="Excluir refeição"
          className="w-8 h-8 rounded-xl bg-white/5 text-white/50 active:bg-protein/30 active:text-protein flex items-center justify-center shrink-0"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        <Pill label="kcal" value={fmtKcal(meal.totals.kcal)} tone="text-brand-400" />
        <Pill label="P" value={fmtG(meal.totals.protein)} tone="text-protein" />
        <Pill label="C" value={fmtG(meal.totals.carbs)} tone="text-carb" />
        <Pill label="G" value={fmtG(meal.totals.fat)} tone="text-fat" />
      </div>

      <details className="mt-3">
        <summary className="text-[11px] text-white/45 cursor-pointer select-none">
          {meal.items.length} {meal.items.length === 1 ? 'item' : 'itens'}
        </summary>
        <ul className="mt-2 space-y-1">
          {meal.items.map((it, i) => (
            <li key={i} className="text-xs text-white/70 flex justify-between gap-2">
              <span className="truncate">
                {it.name} <span className="text-white/40">· {Math.round(it.grams)} g</span>
              </span>
              <span className="text-white/45 shrink-0">{sourceLabel(it.source)}</span>
            </li>
          ))}
        </ul>
      </details>
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

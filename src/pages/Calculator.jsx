/**
 * Calculator page (Phase 4).
 *
 * Form → live preview → "Aplicar no perfil" button that writes the resulting
 * targets into the profile (so Diary's MacroRing uses them automatically).
 *
 * Layout:
 *   1. Formula picker chips (Mifflin / Harris / Katch).
 *   2. Personal inputs (sex, weight, height, age, optional body-fat).
 *   3. Activity level chips.
 *   4. Goal chips (cutting / maintenance / bulk).
 *   5. Live preview card (BMR, TDEE, kcal target, macro grams).
 *   6. Apply button (disabled until all required inputs are filled).
 *
 * Exports: Calculator (default)
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FORMULAS,
  ACTIVITY_LEVELS,
  GOALS,
  computeAll,
} from '../lib/calorias.js';
import { getProfile, setProfile } from '../lib/settings.js';
import { kcal as fmtKcal, g as fmtG } from '../lib/format.js';
import { Section, ChipRow, ToggleButton, NumberField } from '../components/forms/Fields.jsx';

const numeric = (raw) => {
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

export default function Calculator() {
  const profile = getProfile();
  const navigate = useNavigate();
  const [formula, setFormula] = useState('mifflin');
  const [sex, setSex] = useState(profile.sex || 'm');
  const [weight, setWeight] = useState(profile.weightKg ? String(profile.weightKg) : '');
  const [height, setHeight] = useState(profile.heightCm ? String(profile.heightCm) : '');
  const [age, setAge] = useState(profile.age ? String(profile.age) : '');
  const [bodyFat, setBodyFat] = useState('');
  const [activity, setActivity] = useState(profile.activity || 'moderate');
  const [goal, setGoal] = useState(profile.goal || 'maintenance');
  const [savedAt, setSavedAt] = useState(0);

  const w = numeric(weight);
  const h = numeric(height);
  const a = numeric(age);
  const bf = numeric(bodyFat) / 100;

  const ready = useMemo(() => {
    if (!(w > 0 && h > 0 && a > 0)) return false;
    if (formula === 'katch' && !(bf > 0 && bf < 0.6)) return false;
    return true;
  }, [w, h, a, formula, bf]);

  const result = useMemo(() => {
    if (!ready) return null;
    return computeAll({
      formula,
      sex,
      weight: w,
      height: h,
      age: a,
      bodyFat: bf,
      activity,
      goal,
    });
  }, [ready, formula, sex, w, h, a, bf, activity, goal]);

  const apply = () => {
    if (!result) return;
    setProfile({
      sex,
      weightKg: w,
      heightCm: h,
      age: a,
      activity,
      goal,
      kcalTarget: result.kcalTarget,
      proteinTarget: result.macros.protein,
      carbsTarget: result.macros.carbs,
      fatTarget: result.macros.fat,
    });
    setSavedAt(Date.now());
    setTimeout(() => navigate('/'), 700);
  };

  return (
    <div className="px-5 pt-3 pb-6 space-y-4">
      <Section title="Fórmula">
        <ChipRow
          options={FORMULAS}
          value={formula}
          onChange={setFormula}
          renderHint
        />
      </Section>

      <Section title="Você">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <ToggleButton active={sex === 'm'} onClick={() => setSex('m')} label="Masculino" />
          <ToggleButton active={sex === 'f'} onClick={() => setSex('f')} label="Feminino" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="Peso (kg)" value={weight} onChange={setWeight} step="0.1" placeholder="75" />
          <NumberField label="Altura (cm)" value={height} onChange={setHeight} placeholder="180" />
          <NumberField label="Idade" value={age} onChange={setAge} placeholder="28" />
        </div>
        {formula === 'katch' && (
          <div className="mt-2">
            <NumberField
              label="Gordura corporal (%)"
              value={bodyFat}
              onChange={setBodyFat}
              step="0.1"
              placeholder="15"
            />
            {bodyFat && !(bf > 0 && bf < 0.6) && (
              <p className="text-[11px] text-protein mt-1">Use um valor entre 1 e 59.</p>
            )}
          </div>
        )}
      </Section>

      <Section title="Nível de atividade">
        <ChipRow
          options={ACTIVITY_LEVELS}
          value={activity}
          onChange={setActivity}
          renderHint
        />
      </Section>

      <Section title="Objetivo">
        <ChipRow options={GOALS} value={goal} onChange={setGoal} renderHint />
      </Section>

      <PreviewCard result={result} ready={ready} />

      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={!result}
        onClick={apply}
        className="w-full h-12 rounded-2xl bg-brand-500 disabled:bg-white/10 disabled:text-white/40 text-white font-bold"
      >
        {savedAt ? 'Metas aplicadas — voltando ao diário…' : 'Aplicar no perfil'}
      </motion.button>

      <p className="text-[11px] text-white/40 text-center leading-relaxed">
        Estimativas têm margem de ±10%. Ajuste após 2 semanas observando peso e
        composição.
      </p>
    </div>
  );
}

function PreviewCard({ result, ready }) {
  if (!ready) {
    return (
      <div className="rounded-2xl bg-bg-card border border-dashed border-white/10 p-5 text-center">
        <p className="text-sm text-white/55">Preencha peso, altura e idade para ver a estimativa.</p>
      </div>
    );
  }
  return (
    <motion.div
      key={`${result.kcalTarget}-${result.macros.protein}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-2xl bg-bg-card border border-brand-500/30 p-4"
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="TMB" value={fmtKcal(result.bmr)} tone="text-white/85" />
        <Stat label="TDEE" value={fmtKcal(result.tdee)} tone="text-white/85" />
        <Stat label="Meta" value={fmtKcal(result.kcalTarget)} tone="text-brand-400" big />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MacroStat label="Proteína" value={fmtG(result.macros.protein)} tone="text-protein" />
        <MacroStat label="Carbo"    value={fmtG(result.macros.carbs)}   tone="text-carb" />
        <MacroStat label="Gordura"  value={fmtG(result.macros.fat)}     tone="text-fat" />
      </div>
    </motion.div>
  );
}

function Stat({ label, value, tone, big }) {
  return (
    <div>
      <p className="text-[10px] text-white/45 uppercase tracking-wider">{label}</p>
      <p className={`${big ? 'text-lg' : 'text-sm'} font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function MacroStat({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-bg-elev border border-white/5 px-2 py-2">
      <p className="text-[10px] text-white/45 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold ${tone}`}>{value}</p>
    </div>
  );
}

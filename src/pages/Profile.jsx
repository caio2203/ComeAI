/**
 * Profile page (Phase 7) — full version.
 *
 * Sections (top -> bottom):
 *   1. Inteligencia Artificial: Gemini API key + model (key stays in
 *      localStorage only, never exported).
 *   2. Dados pessoais: editable name / sex / weight / height / age / activity
 *      / goal. Writes straight into `profile` so the Diary MacroRing and the
 *      hydration target pick it up.
 *   3. Hidratacao: manual daily water override (blank = auto from bodyweight).
 *   4. Metas atuais: read-only summary of the targets, with a shortcut to the
 *      Calculator to recompute them.
 *   5. Backup: export the whole device to JSON, restore from a file.
 *   6. Zona de risco: wipe everything (two-step confirm).
 *
 * Exports: Profile (default)
 */

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getApiKey, setApiKey, getModel, setModel, getProfile, setProfile } from '../lib/settings.js';
import { ACTIVITY_LEVELS, GOALS } from '../lib/calorias.js';
import { dailyTarget } from '../lib/hydration.js';
import { downloadBackup, readBackupFile, restoreBackup, wipeEverything } from '../lib/backup.js';
import { kcal as fmtKcal, g as fmtG } from '../lib/format.js';
import { Section, ChipRow, ToggleButton, NumberField } from '../components/forms/Fields.jsx';

const MODEL_OPTIONS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash · 1500 req/dia' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash · 1500 req/dia' },
];

const numeric = (raw) => {
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

export default function Profile() {
  const profile = getProfile();

  // IA
  const [key, setKey] = useState(getApiKey());
  const [model, setModelLocal] = useState(getModel());
  const [savedAI, setSavedAI] = useState(false);

  // Dados pessoais
  const [name, setName] = useState(profile.name || '');
  const [sex, setSex] = useState(profile.sex || 'm');
  const [weight, setWeight] = useState(profile.weightKg ? String(profile.weightKg) : '');
  const [height, setHeight] = useState(profile.heightCm ? String(profile.heightCm) : '');
  const [age, setAge] = useState(profile.age ? String(profile.age) : '');
  const [activity, setActivity] = useState(profile.activity || 'moderate');
  const [goal, setGoal] = useState(profile.goal || 'maintenance');
  const [water, setWater] = useState(profile.waterTargetMl ? String(profile.waterTargetMl) : '');
  const [savedPersonal, setSavedPersonal] = useState(false);

  // Backup
  const fileRef = useRef(null);
  const [backupMsg, setBackupMsg] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');
  const [wipeArmed, setWipeArmed] = useState(false);

  const saveAI = () => {
    setApiKey(key);
    setModel(model);
    setSavedAI(true);
    setTimeout(() => setSavedAI(false), 1500);
  };

  const savePersonal = () => {
    const w = numeric(weight);
    const h = numeric(height);
    const a = numeric(age);
    const ml = numeric(water);
    setProfile({
      name: name.trim(),
      sex,
      weightKg: w > 0 ? w : undefined,
      heightCm: h > 0 ? h : undefined,
      age: a > 0 ? a : undefined,
      activity,
      goal,
      // Blank field = let the formula decide; store undefined, not 0.
      waterTargetMl: ml > 0 ? Math.round(ml) : undefined,
    });
    setSavedPersonal(true);
    setTimeout(() => setSavedPersonal(false), 1500);
  };

  const autoWater = dailyTarget({ weightKg: numeric(weight) || profile.weightKg });

  const exportJson = async () => {
    try {
      await downloadBackup();
      setBackupMsg('Backup gerado e baixado.');
    } catch {
      setBackupMsg('Nao foi possivel gerar o backup.');
    }
    setTimeout(() => setBackupMsg(''), 2500);
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file later
    if (!file) return;
    try {
      const parsed = await readBackupFile(file);
      const { mealDays, waterDays } = await restoreBackup(parsed);
      setRestoreMsg(`Restaurado: ${mealDays} dia(s) de refeicoes e ${waterDays} de agua. Recarregando...`);
      setTimeout(() => window.location.reload(), 1100);
    } catch (err) {
      setRestoreMsg(err.message || 'Falha ao importar.');
      setTimeout(() => setRestoreMsg(''), 3000);
    }
  };

  const wipe = async () => {
    if (!wipeArmed) {
      setWipeArmed(true);
      setTimeout(() => setWipeArmed(false), 4000);
      return;
    }
    await wipeEverything();
    window.location.reload();
  };

  const targets = {
    kcal: profile.kcalTarget,
    protein: profile.proteinTarget,
    carbs: profile.carbsTarget,
    fat: profile.fatTarget,
  };
  const hasTargets = targets.kcal > 0;

  return (
    <div className="px-5 pt-4 pb-6 space-y-4">
      {/* 1. IA */}
      <div className="rounded-2xl bg-bg-card border border-white/5 p-5">
        <h2 className="text-base font-bold">Inteligencia Artificial</h2>
        <p className="text-xs text-white/55 mt-1 mb-4">
          Sua chave Gemini fica salva apenas neste dispositivo e nao entra no
          backup. Pegue gratis em{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-brand-400 underline"
          >
            aistudio.google.com
          </a>
          .
        </p>

        <label className="block text-[11px] uppercase tracking-widest text-white/40 mb-1">
          Chave da API
        </label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIza..."
          className="w-full rounded-xl bg-bg-elev border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500/60"
        />

        <label className="block text-[11px] uppercase tracking-widest text-white/40 mt-3 mb-1">
          Modelo
        </label>
        <select
          value={model}
          onChange={(e) => setModelLocal(e.target.value)}
          className="w-full rounded-xl bg-bg-elev border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500/60"
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        <button
          onClick={saveAI}
          className="w-full mt-4 h-11 rounded-xl bg-brand-500 text-white font-bold"
        >
          {savedAI ? 'Salvo' : 'Salvar'}
        </button>
      </div>

      {/* 2. Dados pessoais */}
      <Section title="Dados pessoais">
        <label className="block mb-3">
          <span className="text-[10px] text-white/45 uppercase tracking-wider">Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como prefere ser chamado"
            className="mt-1 w-full rounded-xl bg-bg-elev border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500/60"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <ToggleButton active={sex === 'm'} onClick={() => setSex('m')} label="Masculino" />
          <ToggleButton active={sex === 'f'} onClick={() => setSex('f')} label="Feminino" />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <NumberField label="Peso (kg)" value={weight} onChange={setWeight} step="0.1" placeholder="75" />
          <NumberField label="Altura (cm)" value={height} onChange={setHeight} placeholder="180" />
          <NumberField label="Idade" value={age} onChange={setAge} placeholder="28" />
        </div>

        <p className="text-[10px] text-white/45 uppercase tracking-wider mb-1.5">Nivel de atividade</p>
        <ChipRow options={ACTIVITY_LEVELS} value={activity} onChange={setActivity} renderHint />

        <p className="text-[10px] text-white/45 uppercase tracking-wider mt-3 mb-1.5">Objetivo</p>
        <ChipRow options={GOALS} value={goal} onChange={setGoal} renderHint />

        <button
          onClick={savePersonal}
          className="w-full mt-4 h-11 rounded-xl bg-brand-500 text-white font-bold"
        >
          {savedPersonal ? 'Salvo' : 'Salvar dados'}
        </button>
        <p className="text-[10px] text-white/35 mt-2 leading-relaxed">
          Editar peso ou objetivo aqui nao recalcula as metas de calorias.
          Use a Calculadora para gerar metas novas.
        </p>
      </Section>

      {/* 3. Hidratacao */}
      <Section title="Meta de agua">
        <NumberField
          label="Meta diaria (ml) — em branco usa o automatico"
          value={water}
          onChange={setWater}
          step="50"
          placeholder={String(autoWater)}
        />
        <p className="text-[11px] text-white/55 mt-2">
          Automatico pelo peso: <span className="text-water font-semibold">{autoWater} ml</span> (35 ml/kg).
        </p>
        <button
          onClick={savePersonal}
          className="w-full mt-3 h-11 rounded-xl bg-bg-elev border border-white/10 text-white/80 font-semibold"
        >
          {savedPersonal ? 'Salvo' : 'Salvar meta'}
        </button>
      </Section>

      {/* 4. Metas atuais */}
      <Section title="Metas atuais">
        {hasTargets ? (
          <div className="grid grid-cols-4 gap-2">
            <Metric label="Kcal" value={fmtKcal(targets.kcal)} tone="text-brand-400" />
            <Metric label="Prot" value={fmtG(targets.protein)} tone="text-protein" />
            <Metric label="Carb" value={fmtG(targets.carbs)} tone="text-carb" />
            <Metric label="Gord" value={fmtG(targets.fat)} tone="text-fat" />
          </div>
        ) : (
          <p className="text-sm text-white/55">
            Nenhuma meta definida. Use a Calculadora para gerar suas metas.
          </p>
        )}
        <Link
          to="/calculadora"
          className="mt-3 flex items-center justify-between rounded-xl bg-bg-elev border border-white/10 px-3 py-2.5 active:bg-white/5"
        >
          <span className="text-sm font-semibold">Abrir Calculadora de TMB</span>
          <span className="text-white/40">›</span>
        </Link>
      </Section>

      {/* 5. Backup */}
      <Section title="Backup">
        <p className="text-xs text-white/55 mb-3 leading-relaxed">
          Exporte refeicoes, hidratacao e perfil em um arquivo JSON, ou
          restaure de um backup. A chave Gemini nao e incluida por seguranca.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={exportJson}
            className="h-11 rounded-xl bg-brand-500 text-white font-bold"
          >
            Exportar JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="h-11 rounded-xl bg-bg-elev border border-white/10 text-white/80 font-semibold"
          >
            Importar JSON
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onPickFile}
          className="hidden"
        />
        {backupMsg && <p className="text-[11px] text-brand-400 mt-2">{backupMsg}</p>}
        {restoreMsg && <p className="text-[11px] text-water mt-2">{restoreMsg}</p>}
      </Section>

      {/* 6. Zona de risco */}
      <Section title="Zona de risco">
        <p className="text-xs text-white/55 mb-3 leading-relaxed">
          Apaga todas as refeicoes, registros de agua, perfil e a chave Gemini
          deste dispositivo. Nao tem como desfazer.
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={wipe}
          className={`w-full h-11 rounded-xl font-bold border transition-colors ${
            wipeArmed
              ? 'bg-protein text-white border-protein'
              : 'bg-protein/10 text-protein border-protein/40'
          }`}
        >
          {wipeArmed ? 'Tocar de novo para confirmar' : 'Apagar tudo'}
        </motion.button>
      </Section>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-bg-elev border border-white/5 px-2 py-2 text-center">
      <p className="text-[9px] text-white/45 uppercase tracking-wider">{label}</p>
      <p className={`text-xs font-bold mt-0.5 ${tone}`}>{value}</p>
    </div>
  );
}

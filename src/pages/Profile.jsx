/**
 * Profile page — minimal version wired to the AI flow.
 *
 * Phase 2 deliverable: Gemini API key field so users can unlock NLP parsing.
 * Phase 7 will add: personal data form, modality, goal, JSON export/import,
 * reset and theme.
 *
 * Exports: Profile (default)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiKey, setApiKey, getModel, setModel } from '../lib/settings.js';

const MODEL_OPTIONS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash · 1500 req/dia' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash · 1500 req/dia' },
];

export default function Profile() {
  const [key, setKey] = useState(getApiKey());
  const [model, setModelLocal] = useState(getModel());
  const [saved, setSaved] = useState(false);

  const save = () => {
    setApiKey(key);
    setModel(model);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="px-5 pt-4 pb-6 space-y-4">
      <div className="rounded-2xl bg-bg-card border border-white/5 p-5">
        <h2 className="text-base font-bold">Inteligência Artificial</h2>
        <p className="text-xs text-white/55 mt-1 mb-4">
          Sua chave Gemini fica salva apenas neste dispositivo. Pegue grátis em{' '}
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
          onClick={save}
          className="w-full mt-4 h-11 rounded-xl bg-brand-500 text-white font-bold"
        >
          {saved ? 'Salvo ✓' : 'Salvar'}
        </button>
      </div>

      <Link
        to="/calculadora"
        className="block rounded-2xl bg-bg-card border border-white/5 p-4 active:bg-white/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Calculadora de TMB</p>
            <p className="text-xs text-white/55 mt-0.5">Estimar gasto calórico (etapa 4)</p>
          </div>
          <span className="text-white/40">›</span>
        </div>
      </Link>

      <p className="text-[11px] text-white/40 text-center">
        Dados pessoais, modalidade, objetivo e exportação JSON chegam na etapa 7.
      </p>
    </div>
  );
}

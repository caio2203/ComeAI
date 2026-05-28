/**
 * Inline custom-amount adder.
 *
 * Numeric input + "Adicionar" button. Validates 1 <= ml <= 2000 (single
 * serving cap — a 2 L bottle is the absurd ceiling). Below the input, a
 * stepper row offers ±50 ml taps for quick fine-tuning without bringing up
 * the keyboard again.
 *
 * Exports: CustomAdd (default)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

const MIN = 1;
const MAX = 2000;
const STEP = 50;

/**
 * @param {object} props
 * @param {(ml:number) => void} props.onAdd
 */
export default function CustomAdd({ onAdd }) {
  const [value, setValue] = useState('');
  const numeric = Number(value);
  const valid = Number.isFinite(numeric) && numeric >= MIN && numeric <= MAX;

  const bump = (delta) => {
    const base = Number.isFinite(numeric) && numeric > 0 ? numeric : STEP;
    const next = Math.max(MIN, Math.min(MAX, base + delta));
    setValue(String(next));
  };

  const submit = () => {
    if (!valid) return;
    onAdd(Math.round(numeric));
    setValue('');
  };

  return (
    <div className="rounded-2xl bg-bg-card border border-white/5 p-4">
      <p className="text-[11px] uppercase tracking-widest text-white/45 font-bold mb-3">
        Quantidade personalizada
      </p>

      <div className="flex gap-2">
        <div className="flex-1 flex items-stretch rounded-xl bg-bg-elev border border-white/10 overflow-hidden">
          <button
            onClick={() => bump(-STEP)}
            aria-label="Diminuir 50 ml"
            className="w-10 text-water/85 font-bold text-lg active:bg-white/5"
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={MIN}
            max={MAX}
            step={STEP}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ml"
            className="flex-1 bg-transparent text-center text-base font-bold focus:outline-none"
          />
          <button
            onClick={() => bump(STEP)}
            aria-label="Aumentar 50 ml"
            className="w-10 text-water/85 font-bold text-lg active:bg-white/5"
          >
            +
          </button>
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={submit}
          disabled={!valid}
          className="px-4 rounded-xl bg-water text-bg font-bold text-sm disabled:bg-white/10 disabled:text-white/40"
        >
          Adicionar
        </motion.button>
      </div>

      {value && !valid && (
        <p className="text-[11px] text-protein mt-2">Use um valor entre 1 e 2000 ml.</p>
      )}
    </div>
  );
}

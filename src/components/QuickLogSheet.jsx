/**
 * Bottom sheet that hosts the entire meal entry flow.
 *
 * Steps:
 *   1. "input"      — textarea + voice button + "Calcular" CTA
 *   2. "loading"    — spinner while the cascade runs
 *   3. "confirm"    — ConfirmationView, user tweaks and saves
 *   4. "done"       — short success toast, sheet auto-closes
 *
 * Exports: QuickLogSheet (default)
 * Depends on: framer-motion drag-to-dismiss + window event `athletetrack:meal-saved`
 *   so Diary/Progress can refresh without a global store.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import VoiceButton from './ai/VoiceButton.jsx';
import ConfirmationView from './ai/ConfirmationView.jsx';
import { fullPipeline } from '../lib/nutritionEngine.js';
import { isConfigured as hasGemini } from '../lib/gemini.js';
import { Link } from 'react-router-dom';

const SUGGESTIONS = [
  '200 g de arroz, 100 g feijão e 150 g frango grelhado',
  '2 ovos mexidos com pão integral e café',
  '1 banana e 30 g de whey',
];

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 */
export default function QuickLogSheet({ open, onClose }) {
  const [step, setStep] = useState('input');
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);
  const [warning, setWarning] = useState();
  const [error, setError] = useState();

  useEffect(() => {
    if (!open) {
      // Reset state when closed so the next open starts clean.
      const t = setTimeout(() => {
        setStep('input');
        setText('');
        setItems([]);
        setWarning(undefined);
        setError(undefined);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  const calculate = async () => {
    if (!text.trim()) return;
    setStep('loading');
    setError(undefined);
    try {
      const { items: resolved, warning: w } = await fullPipeline(text.trim());
      if (!resolved.length) {
        setError('Não consegui identificar nenhum alimento. Tente reescrever.');
        setStep('input');
        return;
      }
      setItems(resolved);
      setWarning(w);
      setStep('confirm');
    } catch (err) {
      setError(err?.message || 'Falha ao calcular.');
      setStep('input');
    }
  };

  const onSaved = () => {
    setStep('done');
    // Notify other views (Diary, Progress) without wiring a global store.
    window.dispatchEvent(new CustomEvent('athletetrack:meal-saved'));
    setTimeout(onClose, 900);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={step === 'input' ? onClose : undefined}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag={step === 'input' ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              // 120px downward dismiss threshold — tuned for one-handed thumb reach.
              if (info.offset.y > 120) onClose();
            }}
            className="fixed bottom-0 inset-x-0 z-50 max-w-[480px] mx-auto h-[85vh]
                       rounded-t-3xl bg-bg-card border-t border-white/10 flex flex-col overflow-hidden"
          >
            <div className="flex justify-center pt-3 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/15" />
            </div>

            {step === 'input' && (
              <InputStep
                text={text}
                setText={setText}
                onCalculate={calculate}
                error={error}
                onClose={onClose}
              />
            )}
            {step === 'loading' && <LoadingStep />}
            {step === 'confirm' && (
              <ConfirmationView
                initialItems={items}
                rawDescription={text}
                warning={warning}
                onBack={() => setStep('input')}
                onSaved={onSaved}
              />
            )}
            {step === 'done' && <DoneStep />}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InputStep({ text, setText, onCalculate, error, onClose }) {
  const geminiOn = hasGemini();
  return (
    <div className="px-6 pt-3 pb-safe flex flex-col flex-1 overflow-y-auto no-scrollbar">
      <h2 className="text-xl font-bold mb-1">Registrar refeição</h2>
      <p className="text-sm text-white/60 mb-3">
        Descreva em português. {geminiOn ? 'A IA calcula tudo.' : 'Sem chave Gemini — uso parser offline.'}
      </p>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex: 200g de arroz, 100g feijão preto, 150g frango grelhado e uma laranja"
          rows={4}
          className="w-full rounded-2xl bg-bg-elev border border-white/10 p-4 pr-16 text-[15px] leading-relaxed focus:outline-none focus:border-brand-500/60"
        />
        <div className="absolute right-3 top-3">
          <VoiceButton
            onTranscript={(t, isFinal) => {
              setText(t);
            }}
          />
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-protein">{error}</p>
      )}

      {!geminiOn && (
        <div className="mt-3 rounded-xl bg-carb/10 border border-carb/30 text-carb text-[11px] px-3 py-2">
          Adicione sua chave Gemini em <Link to="/perfil" className="underline font-semibold">Perfil</Link> para parsing inteligente.
        </div>
      )}

      <div className="mt-4">
        <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Sugestões</p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setText(s)}
              className="text-[11px] px-2.5 h-7 rounded-full bg-white/5 text-white/70 border border-white/10"
            >
              {s.length > 36 ? s.slice(0, 36) + '…' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 h-12 rounded-2xl bg-white/5 text-white/70 font-semibold"
        >
          Cancelar
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!text.trim()}
          onClick={onCalculate}
          className="flex-[2] h-12 rounded-2xl bg-brand-500 disabled:bg-white/10 disabled:text-white/40 text-white font-bold"
        >
          Calcular
        </motion.button>
      </div>
    </div>
  );
}

function LoadingStep() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/70">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, ease: 'linear', repeat: Infinity }}
        className="w-10 h-10 rounded-full border-2 border-white/15 border-t-brand-500"
      />
      <p className="text-sm">Calculando macros…</p>
    </div>
  );
}

function DoneStep() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-brand-400">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        className="w-16 h-16 rounded-full bg-brand-500/15 border border-brand-500/40 flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>
      <p className="text-sm font-semibold">Refeição salva!</p>
    </div>
  );
}

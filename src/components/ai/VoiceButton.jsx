/**
 * Voice-input button. Toggles a pt-BR SpeechRecognition session and streams
 * interim transcripts back to the parent.
 *
 * Exports: VoiceButton (default)
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createRecognition, isSupported } from '../../lib/speech.js';

/**
 * @description Mic button. Pulses while recording.
 * @param {object} props
 * @param {(text: string, isFinal: boolean) => void} props.onTranscript
 * @returns {JSX.Element | null}
 */
export default function VoiceButton({ onTranscript }) {
  const [active, setActive] = useState(false);
  const recRef = useRef(null);

  useEffect(() => () => recRef.current?.abort(), []);

  if (!isSupported()) return null;

  const toggle = () => {
    if (active) {
      recRef.current?.stop();
      return;
    }
    const rec = createRecognition({
      onResult: (text, isFinal) => onTranscript(text, isFinal),
      onEnd: () => setActive(false),
      onError: () => setActive(false),
    });
    recRef.current = rec;
    rec.start();
    setActive(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? 'Parar de gravar' : 'Gravar por voz'}
      className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
        active ? 'bg-protein/20 text-protein' : 'bg-white/5 text-white/70'
      }`}
    >
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-2xl bg-protein/40"
          />
        )}
      </AnimatePresence>
      <svg viewBox="0 0 24 24" className="w-5 h-5 relative" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path strokeLinecap="round" d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
  );
}

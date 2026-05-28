/**
 * Bottom sheet with drag-to-dismiss gesture. Placeholder host for the Phase 2
 * AI meal entry flow (voice/text → Gemini → confirmation).
 *
 * Exports: QuickLogSheet (default)
 * Depends on: framer-motion drag axis "y" with elastic resistance
 */
import { AnimatePresence, motion } from 'framer-motion';

/**
 * @description Bottom sheet with drag-to-dismiss. Closes when the user drags
 *   it down by more than 120px (one-handed thumb threshold) or taps the
 *   backdrop. Phase 2 replaces the stub body with the AI meal-entry flow.
 * @param {object} props
 * @param {boolean} props.open - Controls visibility.
 * @param {() => void} props.onClose - Called on dismiss (drag, backdrop, button).
 * @returns {JSX.Element}
 * @example
 *   <QuickLogSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
 */
export default function QuickLogSheet({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              // 120px downward = dismiss. Tuned for one-handed thumb reach on
              // a ~6.1" device; lower felt jumpy, higher fought the user.
              if (info.offset.y > 120) onClose();
            }}
            className="fixed bottom-0 inset-x-0 z-50 max-w-[480px] mx-auto
                       rounded-t-3xl bg-bg-card border-t border-white/10 pb-safe"
          >
            <div className="flex justify-center pt-3">
              <div className="w-12 h-1.5 rounded-full bg-white/15" />
            </div>
            <div className="px-6 pt-4 pb-8">
              <h2 className="text-xl font-bold mb-1">Registrar refeição</h2>
              <p className="text-sm text-white/60 mb-6">
                Em breve: descrição por voz ou texto e cálculo automático com IA.
              </p>

              <div className="rounded-2xl bg-bg-elev border border-white/5 p-4 text-white/70">
                <p className="text-sm">
                  Exemplo: <em className="text-white/90">"almocei arroz, feijão, frango grelhado e salada"</em>
                </p>
              </div>

              <button
                onClick={onClose}
                className="mt-6 w-full h-12 rounded-2xl bg-white/5 text-white/80 font-semibold"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

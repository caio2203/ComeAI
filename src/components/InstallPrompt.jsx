/**
 * Captures the browser's `beforeinstallprompt` event and renders a custom
 * "Install AthleteTrack" CTA. Dismissals are persisted for 14 days.
 *
 * Exports: InstallPrompt (default)
 * Depends on: localStorage key `athletetrack:install-dismissed-at`
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const DISMISS_KEY = 'athletetrack:install-dismissed-at';
// 14-day cooldown after dismiss. Softens Chrome's own ~90d native suppression
// so users still see our custom CTA again in two weeks.
const DISMISS_DAYS = 14;

/**
 * @description Custom PWA install banner. Suppresses native prompt, waits 14d
 *   after a dismissal before showing again. Triggers the deferred prompt only
 *   on explicit user confirmation (required by Chrome's install API).
 * @returns {JSX.Element | null}
 * @example
 *   <InstallPrompt /> // mounted once inside Layout
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      const days = (Date.now() - dismissedAt) / 86400000;
      if (days < DISMISS_DAYS) return;
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setShow(false);
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="absolute bottom-24 inset-x-4 z-40 rounded-2xl bg-bg-card border border-white/10 shadow-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold">
              A
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Instalar AthleteTrack</p>
              <p className="text-xs text-white/60 mt-0.5">
                Abra como app no seu celular. Funciona offline.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={dismiss}
              className="flex-1 h-10 rounded-xl bg-white/5 text-white/70 text-sm font-semibold"
            >
              Agora não
            </button>
            <button
              onClick={install}
              className="flex-1 h-10 rounded-xl bg-brand-500 text-white text-sm font-bold"
            >
              Instalar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

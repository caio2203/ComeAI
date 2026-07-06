/**
 * Floating action button positioned over the BottomTabBar center slot.
 * Opens the QuickLogSheet (meal entry).
 *
 * Exports: FAB (default)
 * Depends on: ring-4 ring-bg trick to fake a concave cutout in the tab bar
 */
import { motion } from 'framer-motion';

/**
 * @description Center floating action button. On tap, opens the QuickLogSheet.
 *   The 4px ring is painted in the same color as the page background, creating
 *   the illusion of a circular cutout in the tab bar without a custom SVG mask.
 * @param {object} props
 * @param {() => void} props.onClick - Handler that opens the QuickLogSheet.
 * @returns {JSX.Element}
 * @example
 *   <FAB onClick={() => setSheetOpen(true)} />
 */
export default function FAB({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.04 }}
      // X centering lives in framer's transform (`x: -50%`), not Tailwind's
      // -translate-x-1/2: whileTap/whileHover rewrite the inline transform and
      // would drop a CSS translate, jerking the button to the right on tap.
      style={{ x: '-50%' }}
      // ring-4 ring-bg: 4px ring painted in the page bg colour fakes a concave
      // cutout in the tab bar — no SVG mask required. Bump if tab-bar height changes.
      className="absolute left-1/2 bottom-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] z-30
                 w-16 h-16 rounded-full bg-brand-500 text-white shadow-fab
                 flex items-center justify-center ring-4 ring-bg
                 active:bg-brand-600"
      aria-label="Registrar refeição"
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      </svg>
    </motion.button>
  );
}

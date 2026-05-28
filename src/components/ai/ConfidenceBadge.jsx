/**
 * Small coloured pill that visualises a 0..1 confidence score.
 *
 * Exports: ConfidenceBadge (default), sourceLabel
 */

const SOURCE_LABEL = {
  taco: 'TACO',
  off: 'Open Food Facts',
  gemini: 'IA estimada',
  manual: 'Manual',
};

/** @description Friendly label for a nutrition source id. */
export const sourceLabel = (s) => SOURCE_LABEL[s] || s;

/**
 * @param {object} props
 * @param {number} props.confidence - 0..1
 * @param {'taco'|'off'|'gemini'|'manual'} props.source
 */
export default function ConfidenceBadge({ confidence, source }) {
  const pct = Math.round((confidence ?? 0) * 100);
  // Thresholds tuned to: TACO matches usually score >0.85; OFF often 0.7-0.85;
  // Gemini estimates around 0.5-0.7. Below 0.5 warrants a "review" warning.
  const tone =
    confidence >= 0.8
      ? 'bg-brand-500/15 text-brand-400 border-brand-500/30'
      : confidence >= 0.5
        ? 'bg-carb/15 text-carb border-carb/30'
        : 'bg-protein/15 text-protein border-protein/30';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tone}`}>
      <span className="opacity-80">{sourceLabel(source)}</span>
      <span>·</span>
      <span>{pct}%</span>
    </span>
  );
}

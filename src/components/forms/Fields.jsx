/**
 * Shared form primitives used by the Calculator and Profile pages. Extracted
 * so the chip / toggle / number-field styling stays identical across the two
 * data-entry screens instead of drifting in two copies.
 *
 * Exports: Section, ChipRow, ToggleButton, NumberField
 */

/**
 * @description Card-wrapped form group with an uppercase label.
 * @param {{title:string, children:React.ReactNode}} props
 */
export function Section({ title, children }) {
  return (
    <div className="rounded-2xl bg-bg-card border border-white/5 p-4">
      <h2 className="text-[11px] uppercase tracking-widest text-white/45 font-bold mb-3">{title}</h2>
      {children}
    </div>
  );
}

/**
 * @description Pill chips for single-choice options ({id,label,hint}).
 *   When `renderHint` is set, the active option's hint shows below the row.
 * @param {{options:{id:string,label:string,hint?:string}[], value:string,
 *   onChange:(id:string)=>void, renderHint?:boolean}} props
 */
export function ChipRow({ options, value, onChange, renderHint }) {
  const active = options.find((o) => o.id === value);
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`px-3 h-8 rounded-full text-xs font-semibold border transition-colors ${
              value === o.id
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-bg-elev text-white/70 border-white/10'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {renderHint && active?.hint && (
        <p className="text-[11px] text-white/55 mt-2">{active.hint}</p>
      )}
    </>
  );
}

/**
 * @description Two-state segmented button (e.g. Masculino / Feminino).
 * @param {{active:boolean, onClick:()=>void, label:string}} props
 */
export function ToggleButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`h-10 rounded-xl border text-sm font-semibold transition-colors ${
        active ? 'bg-brand-500/15 text-brand-400 border-brand-500/50' : 'bg-bg-elev text-white/70 border-white/10'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * @description Labeled numeric input (decimal keypad on mobile).
 * @param {{label:string, value:string, onChange:(v:string)=>void,
 *   step?:string, placeholder?:string}} props
 */
export function NumberField({ label, value, onChange, step, placeholder }) {
  return (
    <label className="block">
      <span className="text-[10px] text-white/45 uppercase tracking-wider">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step || '1'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl bg-bg-elev border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500/60"
      />
    </label>
  );
}

export default function PagePlaceholder({ title, description }) {
  return (
    <div className="rounded-2xl bg-bg-card border border-dashed border-white/10 p-6 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>
        </svg>
      </div>
      <h2 className="text-base font-bold mb-1">{title}</h2>
      <p className="text-sm text-white/55 leading-relaxed">{description}</p>
    </div>
  );
}

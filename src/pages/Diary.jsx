import PagePlaceholder from '../components/PagePlaceholder.jsx';

export default function Diary() {
  return (
    <div className="px-5 pt-4 space-y-4">
      <MacroBarPreview />
      <PagePlaceholder
        title="Diário do dia"
        description="Aqui virão as refeições registradas, organizadas por categoria (café, pré-treino, almoço, pós, jantar, lanche). A etapa 3 entrega timeline + swipe."
      />
    </div>
  );
}

function MacroBarPreview() {
  const macros = [
    { label: 'Calorias', value: 0, target: 2500, color: 'bg-brand-500' },
    { label: 'P', value: 0, target: 180, color: 'bg-protein' },
    { label: 'C', value: 0, target: 280, color: 'bg-carb' },
    { label: 'G', value: 0, target: 75, color: 'bg-fat' },
  ];
  return (
    <div className="rounded-2xl bg-bg-card border border-white/5 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-white/70">Meta do dia</h2>
        <span className="text-xs text-white/40">prévia</span>
      </div>
      <div className="space-y-2.5">
        {macros.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-[11px] text-white/60 mb-1">
              <span>{m.label}</span>
              <span>
                {m.value} / {m.target}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className={`h-full w-0 ${m.color}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

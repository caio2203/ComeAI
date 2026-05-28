import { Link } from 'react-router-dom';
import PagePlaceholder from '../components/PagePlaceholder.jsx';

export default function Profile() {
  return (
    <div className="px-5 pt-4 space-y-4">
      <PagePlaceholder
        title="Perfil"
        description="Dados pessoais, modalidade, objetivo, chave Gemini e exportação JSON chegam na etapa 7."
      />
      <Link
        to="/calculadora"
        className="block rounded-2xl bg-bg-card border border-white/5 p-4 active:bg-white/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Calculadora de TMB</p>
            <p className="text-xs text-white/55 mt-0.5">
              Estimar gasto calórico (etapa 4)
            </p>
          </div>
          <span className="text-white/40">›</span>
        </div>
      </Link>
    </div>
  );
}

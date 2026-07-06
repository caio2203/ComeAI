/**
 * Sticky top bar. Shows today's date in pt-BR long format and a contextual
 * title derived from the current pathname.
 *
 * Exports: TopBar (default)
 * Depends on: pathname → TITLES map (extend when adding a new top-level route)
 */
import { useLocation, Link } from 'react-router-dom';
import { getProfile } from '../lib/settings.js';

const TITLES = {
  '/': 'Hoje',
  '/hidratacao': 'Hidratação',
  '/evolucao': 'Evolução',
  '/perfil': 'Perfil',
  '/calculadora': 'Calculadora',
};

/**
 * @description Sticky header with current route title and today's date.
 * @returns {JSX.Element}
 */
export default function TopBar() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'ComeAI';
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  // First letter of the configured name, falling back to the app initial.
  const initial = (getProfile().name || 'C').trim().charAt(0).toUpperCase() || 'C';

  return (
    <header className="pt-safe px-5 pb-3 bg-bg/95 backdrop-blur sticky top-0 z-30 border-b border-white/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">
            {today}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        </div>
        <Link
          to="/perfil"
          aria-label="Abrir perfil"
          className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center active:bg-brand-500/20"
        >
          <span className="text-brand-400 font-bold">{initial}</span>
        </Link>
      </div>
    </header>
  );
}

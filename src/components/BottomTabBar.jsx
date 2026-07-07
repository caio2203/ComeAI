/**
 * 5-column bottom navigation. Columns 1-2 and 4-5 hold tabs; column 3 is a
 * deliberate empty slot so the absolutely-positioned FAB overlaps without
 * occluding any icon.
 *
 * Exports: BottomTabBar (default)
 * Depends on: NavLink isActive callback for per-tab styling
 */
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const TABS_LEFT = [
  { to: '/', label: 'Hoje', icon: DiaryIcon },
  { to: '/hidratacao', label: 'Água', icon: DropIcon },
];

const TABS_RIGHT = [
  { to: '/evolucao', label: 'Evolução', icon: ChartIcon },
  { to: '/perfil', label: 'Perfil', icon: UserIcon },
];

/**
 * @description Bottom tab bar with 4 tabs and a reserved central slot for the
 *   FAB. Active tab scales 1.1x with a spring transition.
 * @returns {JSX.Element}
 */
export default function BottomTabBar() {
  return (
    <nav className="absolute bottom-0 inset-x-0 z-20 pb-safe bg-bg-elev/95 backdrop-blur border-t border-white/5 shadow-tab">
      <div className="grid grid-cols-5 items-end h-16">
        {TABS_LEFT.map((t) => (
          <TabButton key={t.to} {...t} />
        ))}
        <div /> {/* espaço reservado para o FAB central */}
        {TABS_RIGHT.map((t) => (
          <TabButton key={t.to} {...t} />
        ))}
      </div>
    </nav>
  );
}

function TabButton({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className="flex flex-col items-center justify-center gap-1 pt-2 pb-1 select-none"
    >
      {({ isActive }) => (
        <>
          <motion.div
            animate={{ scale: isActive ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={`tab-icon transition-colors ${
              isActive ? 'text-brand-400' : 'text-white/55'
            }`}
          >
            <Icon />
          </motion.div>
          <span
            className={`text-[10px] font-semibold tracking-wide transition-colors ${
              isActive ? 'text-brand-400' : 'text-white/50'
            }`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

/* --- ícones SVG inline (sem dependência externa) --- */

function DiaryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v15l-3-2-3 2-3-2-3 2-2-2V5z"/>
      <path strokeLinecap="round" d="M8 8h7M8 12h7M8 16h4"/>
    </svg>
  );
}
function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z"/>
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M8 16l3-4 3 3 5-7"/>
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>
    </svg>
  );
}

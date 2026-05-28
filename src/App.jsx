/**
 * Top-level route table. Mounts every page inside the mobile Layout shell.
 *
 * Exports: App (default)
 * Depends on: react-router-dom v6 (BrowserRouter is provided by main.jsx)
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Diary from './pages/Diary.jsx';
import Hydration from './pages/Hydration.jsx';
import Profile from './pages/Profile.jsx';
import Calculator from './pages/Calculator.jsx';

// Progress pulls in Recharts (~110 KB gz). Lazy-load it so the chart library
// only ships when the user opens Evolução, keeping the Diary landing lean.
const Progress = lazy(() => import('./pages/Progress.jsx'));

/**
 * @description Route table. Wraps every page in the Layout shell and
 *   redirects unknown paths back to the Diary (`/`).
 * @returns {JSX.Element}
 * @example
 *   // mounted from main.jsx
 *   <BrowserRouter><App /></BrowserRouter>
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Diary />} />
        <Route path="/hidratacao" element={<Hydration />} />
        <Route
          path="/evolucao"
          element={
            <Suspense fallback={<div className="px-5 pt-6 text-sm text-white/45">Carregando gráficos…</div>}>
              <Progress />
            </Suspense>
          }
        />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/calculadora" element={<Calculator />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

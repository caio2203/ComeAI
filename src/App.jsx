/**
 * Top-level route table. Mounts every page inside the mobile Layout shell.
 *
 * Exports: App (default)
 * Depends on: react-router-dom v6 (BrowserRouter is provided by main.jsx)
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Diary from './pages/Diary.jsx';
import Hydration from './pages/Hydration.jsx';
import Progress from './pages/Progress.jsx';
import Profile from './pages/Profile.jsx';
import Calculator from './pages/Calculator.jsx';

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
        <Route path="/evolucao" element={<Progress />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/calculadora" element={<Calculator />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

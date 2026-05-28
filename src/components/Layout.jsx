/**
 * Mobile app shell: 480px-wide centered container, sticky TopBar, BottomTabBar
 * with center FAB, route transition wrapper, and global QuickLogSheet host.
 *
 * Exports: Layout (default)
 * Depends on: framer-motion AnimatePresence keyed by pathname for transitions
 */
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import BottomTabBar from './BottomTabBar.jsx';
import FAB from './FAB.jsx';
import TopBar from './TopBar.jsx';
import InstallPrompt from './InstallPrompt.jsx';
import QuickLogSheet from './QuickLogSheet.jsx';

/**
 * @description Root of the mobile shell. Renders the sticky TopBar, the page
 *   <Outlet/> with route transitions, the BottomTabBar with the FAB above it,
 *   and the QuickLogSheet host (controlled here so the FAB can open it from
 *   anywhere). Also mounts the InstallPrompt.
 * @returns {JSX.Element}
 * @example
 *   <Routes>
 *     <Route element={<Layout />}>
 *       <Route path="/" element={<Diary />} />
 *     </Route>
 *   </Routes>
 */
export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  // PWA shortcut "Registrar refeição" lands on /?action=quick-log. Open the
  // sheet, then strip the param so a refresh doesn't reopen it.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'quick-log') {
      setSheetOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  return (
    <div className="app-shell relative flex flex-col h-full w-full max-w-[480px] mx-auto bg-bg text-white">
      <TopBar />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <FAB onClick={() => setSheetOpen(true)} />
      <BottomTabBar />

      <QuickLogSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <InstallPrompt />
    </div>
  );
}

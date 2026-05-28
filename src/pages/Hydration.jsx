/**
 * Hydration page (Phase 5).
 *
 * Layout (top → bottom):
 *   1. DaySelector (reused from Diary).
 *   2. Animated WaterRing with current total / target / "Faltam X ml".
 *   3. Three preset quick-add buttons (150 / 250 / 500 ml).
 *   4. Custom-amount field with ±50 ml stepper.
 *   5. List of today's entries, each swipe-to-delete (offset < −60 px or
 *      velocity < −400 px/s, matching the meal cards).
 *   6. Footer note explaining how the target was derived (35 ml × peso, or
 *      default if no weight in profile).
 *
 * State is reloaded from IndexedDB on every mutation so the ring animates
 * from the persisted truth, not a local-only optimistic value.
 *
 * Exports: Hydration (default)
 */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DaySelector from '../components/diary/DaySelector.jsx';
import WaterRing from '../components/hydration/WaterRing.jsx';
import QuickAdd from '../components/hydration/QuickAdd.jsx';
import CustomAdd from '../components/hydration/CustomAdd.jsx';
import EntryList from '../components/hydration/EntryList.jsx';
import { toLocalISODate } from '../lib/db.js';
import {
  addEntry,
  dailyTarget,
  getDay,
  PER_KG_ML,
  removeEntry,
} from '../lib/hydration.js';
import { getProfile } from '../lib/settings.js';

export default function Hydration() {
  const [iso, setIso] = useState(toLocalISODate());
  const [entries, setEntries] = useState([]);
  const [floater, setFloater] = useState(null);
  const profile = getProfile();
  const target = dailyTarget({
    weightKg: profile.weightKg,
    override: profile.waterTargetMl,
  });

  const reload = useCallback(async () => {
    setEntries(await getDay(iso));
  }, [iso]);

  useEffect(() => {
    reload();
  }, [reload]);

  const total = entries.reduce((s, e) => s + e.ml, 0);

  const handleAdd = async (ml) => {
    await addEntry(ml);
    setFloater({ id: Date.now(), ml });
    setTimeout(() => setFloater(null), 900);
    reload();
  };

  const handleDelete = async (id) => {
    await removeEntry(iso, id);
    reload();
  };

  return (
    <div className="px-5 pt-3 pb-6 space-y-4">
      <DaySelector iso={iso} onChange={setIso} />

      <div className="rounded-2xl bg-bg-card border border-white/5 p-5 relative overflow-hidden">
        <WaterRing totalMl={total} targetMl={target} />
        {floater && (
          <motion.span
            key={floater.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: -28 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 top-1/2 text-water font-extrabold text-lg pointer-events-none"
          >
            +{floater.ml} ml
          </motion.span>
        )}
      </div>

      <QuickAdd onAdd={handleAdd} />

      <CustomAdd onAdd={handleAdd} />

      <div>
        <p className="text-[11px] uppercase tracking-widest text-white/45 font-bold mb-2 px-1">
          Registros do dia
        </p>
        <EntryList entries={entries} onDelete={handleDelete} />
      </div>

      <TargetFootnote target={target} profile={profile} />
    </div>
  );
}

function TargetFootnote({ target, profile }) {
  const source = profile.waterTargetMl
    ? 'Meta personalizada definida no perfil.'
    : profile.weightKg
    ? `Meta calculada por ${PER_KG_ML} ml × ${profile.weightKg} kg.`
    : 'Meta padrão (peso não configurado no perfil).';
  return (
    <p className="text-[11px] text-white/40 text-center leading-relaxed">
      {source} Alvo: {target.toLocaleString('pt-BR')} ml.
    </p>
  );
}

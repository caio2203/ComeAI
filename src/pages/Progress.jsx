/**
 * Progress page (Phase 6) — evolution charts over 7 / 30 days.
 *
 * Reads historical buckets straight from IndexedDB (one read per day in the
 * window) instead of caching aggregates, because a personal PWA never has
 * enough days for this to matter and it keeps the math honest.
 *
 * Layout (top → bottom):
 *   1. Range chips (7 / 30 dias) — same visual language as Calculator.
 *   2. Calorie line chart with a dashed ReferenceLine at the kcal target.
 *   3. Hydration bar chart with a dashed ReferenceLine at the water target.
 *   4. Average macros for the window (P/C/G mini bars vs profile targets).
 *   5. Adherence card: share of tracked days that hit both kcal and water.
 *
 * Exports: Progress (default)
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { getTotalsForDay, toLocalISODate, shiftISO } from '../lib/db.js';
import { getTotalForDay, dailyTarget } from '../lib/hydration.js';
import { getProfile } from '../lib/settings.js';
import { pct, g as fmtG } from '../lib/format.js';

// Recharts renders into SVG, so colors must be literal strings rather than
// Tailwind classes. These mirror the `tailwind.config.js` palette 1:1.
const COLOR = {
  brand: '#34D399',
  water: '#60A5FA',
  protein: '#F87171',
  carb: '#FBBF24',
  fat: '#A78BFA',
  grid: 'rgba(255,255,255,0.05)',
  axis: 'rgba(255,255,255,0.45)',
  ref: 'rgba(255,255,255,0.25)',
};

const RANGES = [
  { id: 7, label: '7 dias' },
  { id: 30, label: '30 dias' },
];

/** @description "2026-05-28" → "28/05" for compact mobile X-axis ticks. */
const ddMM = (iso) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

export default function Progress() {
  const [range, setRange] = useState(7);
  const [data, setData] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const profile = getProfile();

  // Refetch when a meal or water entry is saved elsewhere so the charts stay
  // live if this page is already mounted, instead of only on remount.
  useEffect(() => {
    const onSaved = () => setRefreshKey((k) => k + 1);
    window.addEventListener('comeai:meal-saved', onSaved);
    window.addEventListener('comeai:water-saved', onSaved);
    return () => {
      window.removeEventListener('comeai:meal-saved', onSaved);
      window.removeEventListener('comeai:water-saved', onSaved);
    };
  }, []);

  const targets = useMemo(
    () => ({
      kcal: profile.kcalTarget || 2500,
      protein: profile.proteinTarget || 180,
      carbs: profile.carbsTarget || 280,
      fat: profile.fatTarget || 75,
      water: dailyTarget({ weightKg: profile.weightKg, override: profile.waterTargetMl }),
    }),
    [
      profile.kcalTarget,
      profile.proteinTarget,
      profile.carbsTarget,
      profile.fatTarget,
      profile.weightKg,
      profile.waterTargetMl,
    ],
  );

  // Oldest → newest so the charts read left-to-right like a calendar.
  const isoDays = useMemo(() => {
    const today = toLocalISODate();
    const arr = [];
    for (let i = range - 1; i >= 0; i--) arr.push(shiftISO(today, -i));
    return arr;
  }, [range]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await Promise.all(
        isoDays.map(async (iso) => {
          const [totals, water] = await Promise.all([getTotalsForDay(iso), getTotalForDay(iso)]);
          return { iso, label: ddMM(iso), water, ...totals };
        }),
      );
      if (!cancelled) setData(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [isoDays, refreshKey]);

  // A day "counts" once the user logged anything that day; untracked days are
  // excluded from averages and adherence so gaps don't read as failures.
  const trackedDays = useMemo(() => data.filter((d) => d.kcal > 0 || d.water > 0), [data]);

  const avgMacros = useMemo(() => {
    const fed = data.filter((d) => d.kcal > 0);
    if (fed.length === 0) return { protein: 0, carbs: 0, fat: 0 };
    const sum = fed.reduce(
      (a, d) => ({ protein: a.protein + d.protein, carbs: a.carbs + d.carbs, fat: a.fat + d.fat }),
      { protein: 0, carbs: 0, fat: 0 },
    );
    return {
      protein: sum.protein / fed.length,
      carbs: sum.carbs / fed.length,
      fat: sum.fat / fed.length,
    };
  }, [data]);

  const adherence = useMemo(() => {
    if (trackedDays.length === 0) return null;
    const ok = trackedDays.filter((d) => {
      // Only judge the metrics the user actually logged that day — otherwise
      // someone who tracks food but never water would sit at 0% forever.
      const kcalOk = d.kcal === 0 || Math.abs(d.kcal - targets.kcal) <= targets.kcal * 0.1;
      const waterOk = d.water === 0 || d.water >= targets.water * 0.8;
      return kcalOk && waterOk;
    }).length;
    return { ok, total: trackedDays.length, pct: Math.round((ok / trackedDays.length) * 100) };
  }, [trackedDays, targets]);

  // Untracked days would otherwise plunge the calorie line to zero; feeding
  // null instead makes Recharts skip them (paired with connectNulls).
  const kcalData = useMemo(
    () => data.map((d) => ({ ...d, kcal: d.kcal > 0 ? d.kcal : null })),
    [data],
  );

  const hasData = trackedDays.length > 0;
  // Thin the X labels on the 30-day view; 7 days fits every tick.
  const xInterval = range === 7 ? 0 : 4;

  return (
    <div className="px-5 pt-3 pb-6 space-y-4">
      <div className="flex gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`px-3 h-8 rounded-full text-xs font-semibold border transition-colors ${
              range === r.id
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-bg-elev text-white/70 border-white/10'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {!hasData ? (
        <EmptyState />
      ) : (
        <>
          <ChartCard title="Calorias por dia" index={0}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={kcalData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid stroke={COLOR.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  interval={xInterval}
                  tick={{ fill: COLOR.axis, fontSize: 10 }}
                  axisLine={{ stroke: COLOR.grid }}
                  tickLine={false}
                />
                <ReferenceLine
                  y={targets.kcal}
                  stroke={COLOR.ref}
                  strokeDasharray="4 4"
                  label={{ value: 'Meta', position: 'right', fill: COLOR.axis, fontSize: 9 }}
                />
                <Tooltip
                  cursor={{ stroke: COLOR.grid }}
                  content={(p) => <ChartTooltip {...p} unit="kcal" round />}
                />
                <Line
                  type="monotone"
                  dataKey="kcal"
                  name="Calorias"
                  stroke={COLOR.brand}
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: COLOR.brand, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Hidratação por dia" index={1}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid stroke={COLOR.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  interval={xInterval}
                  tick={{ fill: COLOR.axis, fontSize: 10 }}
                  axisLine={{ stroke: COLOR.grid }}
                  tickLine={false}
                />
                <ReferenceLine
                  y={targets.water}
                  stroke={COLOR.ref}
                  strokeDasharray="4 4"
                  label={{ value: 'Meta', position: 'right', fill: COLOR.axis, fontSize: 9 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  content={(p) => <ChartTooltip {...p} unit="ml" round />}
                />
                <Bar
                  dataKey="water"
                  name="Água"
                  fill={COLOR.water}
                  radius={[3, 3, 0, 0]}
                  animationDuration={600}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Macros médios do período" index={2}>
            <div className="space-y-2.5 pt-1">
              <AvgMacroBar
                label="Proteínas"
                value={avgMacros.protein}
                target={targets.protein}
                color="bg-protein"
                text="text-protein"
              />
              <AvgMacroBar
                label="Carbos"
                value={avgMacros.carbs}
                target={targets.carbs}
                color="bg-carb"
                text="text-carb"
              />
              <AvgMacroBar
                label="Gorduras"
                value={avgMacros.fat}
                target={targets.fat}
                color="bg-fat"
                text="text-fat"
              />
            </div>
            <p className="text-[10px] text-white/35 mt-3">
              Média sobre os dias com refeições registradas.
            </p>
          </ChartCard>

          <AdherenceCard adherence={adherence} index={3} />
        </>
      )}
    </div>
  );
}

function ChartCard({ title, index, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-2xl bg-bg-card border border-white/5 p-4"
    >
      <h2 className="text-[11px] uppercase tracking-widest text-white/45 font-bold mb-3">{title}</h2>
      {children}
    </motion.div>
  );
}

/**
 * @description Recharts tooltip styled to the app shell (bg-elev surface,
 *   white/10 border, pt-BR thousands separator).
 */
function ChartTooltip({ active, payload, label, unit, round }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-bg-elev border border-white/10 px-3 py-2 shadow-lg">
      <p className="text-[10px] text-white/45 mb-1">{label}</p>
      {payload.map((p) => {
        const v = round ? Math.round(p.value) : p.value;
        return (
          <p key={p.dataKey} className="text-xs font-semibold" style={{ color: p.color }}>
            {p.name}: {v.toLocaleString('pt-BR')} {unit}
          </p>
        );
      })}
    </div>
  );
}

function AvgMacroBar({ label, value, target, color, text }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className={`font-semibold ${text}`}>{label}</span>
        <span className="text-white/55">
          {fmtG(value)} <span className="text-white/30">/ {fmtG(target)}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct(value, target)}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}

function AdherenceCard({ adherence, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-2xl bg-bg-card border border-brand-500/30 p-4"
    >
      <h2 className="text-[11px] uppercase tracking-widest text-white/45 font-bold mb-2">Aderência</h2>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-extrabold text-brand-400 leading-none">{adherence.pct}%</p>
        <p className="text-[11px] text-white/45 mb-0.5">
          {adherence.ok} de {adherence.total} {adherence.total === 1 ? 'dia' : 'dias'}
        </p>
      </div>
      <p className="text-[11px] text-white/55 mt-2 leading-relaxed">
        Dias em que as metas registradas bateram: calorias dentro de ±10% e água em pelo menos 80%.
      </p>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl bg-bg-card border border-dashed border-white/10 p-6 text-center"
    >
      <p className="text-sm text-white/55 leading-relaxed">
        Registre refeições e água para ver sua evolução.
      </p>
    </motion.div>
  );
}

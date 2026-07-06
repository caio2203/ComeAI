/**
 * Tiny "vs ontem" badge — Δkcal between today and the previous day.
 *
 * Hidden when there were no meals yesterday (nothing meaningful to compare).
 *
 * Exports: DayDelta (default)
 */

import { useEffect, useState } from 'react';
import { getTotalsForDay, shiftISO, toLocalISODate } from '../../lib/db.js';

/**
 * @param {object} props
 * @param {string} props.iso
 * @param {{kcal:number}} props.totalsToday
 */
export default function DayDelta({ iso, totalsToday }) {
  const [yesterday, setYesterday] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getTotalsForDay(shiftISO(iso, -1)).then((t) => {
      if (!cancelled) setYesterday(t);
    });
    return () => {
      cancelled = true;
    };
  }, [iso]);

  if (!yesterday || yesterday.kcal === 0) return null;
  const delta = totalsToday.kcal - yesterday.kcal;
  const sign = delta > 0 ? '+' : '';
  // "vs ontem" only holds when the visible day is today; on a past day the
  // comparison is against its own previous day.
  const ref = iso === toLocalISODate() ? 'vs ontem' : 'vs dia anterior';
  // Up isn't always "bad" (bulk) and down isn't always "good" (cutting), so
  // we use a neutral muted style rather than red/green.
  return (
    <span className="text-[11px] text-white/55">
      {sign}
      {Math.round(delta).toLocaleString('pt-BR')} kcal {ref}
    </span>
  );
}

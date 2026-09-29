'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { RepairStatistics } from '@/lib/statistics';
export function HomeStatistics() {
  const [stats, setStats] = useState<RepairStatistics | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void fetch('/api/statistics')
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = (await response.json()) as {
          statistics: RepairStatistics;
        };
        if (active) setStats(data.statistics);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <>
      <div className="hero-stats" aria-label="Reported community statistics">
        <div>
          <strong>{stats?.total_repair_cases ?? '—'}</strong>
          <span>community cases</span>
        </div>
        <div>
          <strong>{stats?.successful_repairs ?? '—'}</strong>
          <span>reported fixed / improved</span>
        </div>
        <div>
          <strong>{stats?.example_cases ?? '—'}</strong>
          <span>separate examples / practice</span>
        </div>
      </div>
      <p className="stats-note">
        {failed
          ? 'Statistics unavailable. Try the dashboard again later.'
          : 'Self-reported outcomes. Examples and practice cases are excluded from community totals.'}{' '}
        <LinkToExamples />
      </p>
    </>
  );
}
function LinkToExamples() {
  return <Link href="/repairs?source=examples">Browse examples</Link>;
}

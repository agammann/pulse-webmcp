'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { RepairStatistics } from '@/lib/statistics';
import { outcomeLabel } from '@/lib/domain';
export function DashboardView() {
  const [stats, setStats] = useState<RepairStatistics | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/statistics');
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { statistics: RepairStatistics };
      setStats(data.statistics);
      setError('');
    } catch {
      setError('Statistics are unavailable. Try again.');
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    window.addEventListener('pulse:mutated', load);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pulse:mutated', load);
    };
  }, [load]);
  if (!stats)
    return (
      <div className="dashboard-shell">
        <output>{error || 'Loading saved case statistics…'}</output>
        {error && <button onClick={() => void load()}>Retry</button>}
      </div>
    );
  const maximum = Math.max(
    ...stats.most_repaired_categories.map((item) => item.count),
    1,
  );
  return (
    <div className="dashboard-shell">
      <p className="inline-notice">
        Community outcomes are self-reported, not independently verified.{' '}
        {stats.example_cases} example / practice cases are excluded. Success
        rate uses only the {stats.completed_cases} cases with a recorded
        outcome.
      </p>
      {error && (
        <p role="alert">{error} The last loaded values remain below.</p>
      )}
      <section className="metric-grid">
        <div>
          <span>Community cases</span>
          <strong>{stats.total_repair_cases}</strong>
          <small>All saved community cases</small>
        </div>
        <div>
          <span>Reported fixed or improved</span>
          <strong>{stats.successful_repairs}</strong>
          <small>Outcomes reported by contributors</small>
        </div>
        <div>
          <span>Success among recorded outcomes</span>
          <strong>
            {stats.success_rate === null ? '—' : `${stats.success_rate}%`}
          </strong>
          <small>Open cases excluded from denominator</small>
        </div>
        <div>
          <span>Median recorded cost</span>
          <strong>
            {stats.median_recorded_cost === null
              ? '—'
              : `$${stats.median_recorded_cost}`}
          </strong>
          <small>USD, across all recorded outcomes</small>
        </div>
      </section>
      <section className="category-chart">
        <h2>Community categories</h2>
        <div className="category-bars">
          {stats.most_repaired_categories.map((item) => (
            <div key={item.category}>
              <span>
                {item.category}
                <b>{item.count}</b>
              </span>
              <div>
                <i style={{ width: `${(item.count / maximum) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        {!stats.total_repair_cases && (
          <p>
            No community cases yet.{' '}
            <Link href="/repair/new">Start a repair journal</Link> or{' '}
            <Link href="/repairs?source=examples">
              browse the separate examples
            </Link>
            .
          </p>
        )}
      </section>
      <section className="recent-cases">
        <h2>Recent reported outcomes</h2>
        <div>
          {stats.recent_outcomes.map((item) => (
            <Link key={item.id} href={`/repairs/${item.id}`}>
              <span>{item.outcome && outcomeLabel(item.outcome.outcome)}</span>
              <span>
                <small>
                  {item.id} · {item.category}
                </small>
                <strong>{item.problem_description}</strong>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

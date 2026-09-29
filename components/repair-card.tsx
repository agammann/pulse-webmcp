import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Coins,
  ShieldCheck,
  ThumbsUp,
} from 'lucide-react';
import type { RepairCase, RepairSearchResult } from '@/lib/domain';
import { outcomeLabel, safetyLabel } from '@/lib/domain';

export function RepairCard({
  repair,
}: {
  repair: RepairCase | RepairSearchResult;
}) {
  const evidence =
    'evidence' in repair
      ? repair.evidence
      : {
          attempts: repair.attempt_count ?? repair.repair_attempts.length,
          fixed: repair.votes.worked_for_me,
          recorded_time_minutes: repair.outcome?.time_minutes ?? 0,
          recorded_cost: repair.outcome ? `$${repair.outcome.cost}` : 'Unknown',
        };
  return (
    <article className="repair-card">
      <div className="repair-card-kicker">
        <span>{repair.category}</span>
        <span className={`safety-badge ${repair.safety_classification}`}>
          <ShieldCheck /> {safetyLabel(repair.safety_classification)}
        </span>
      </div>
      <p className="mono-label">
        {repair.id}{' '}
        {repair.demo_record ? '· EXAMPLE / PRACTICE' : '· COMMUNITY CASE'}
      </p>
      <h2>
        <Link href={`/repairs/${repair.id}`}>{repair.problem_description}</Link>
      </h2>
      <p className="repair-product">
        {repair.brand} {repair.product_name} · {repair.model}
      </p>
      <div className="tag-list">
        {repair.symptoms.map((symptom) => (
          <span key={symptom}>{symptom}</span>
        ))}
      </div>
      <div className="repair-evidence-row">
        <span>
          <CheckCircle2 />
          <strong>
            {repair.outcome
              ? outcomeLabel(repair.outcome.outcome)
              : 'In progress'}
          </strong>
        </span>
        <span>
          <ThumbsUp />
          <strong>{evidence.fixed}</strong> reported success
        </span>
        <span>
          <Clock3 />
          <strong>{evidence.recorded_time_minutes || '—'}</strong> min
        </span>
        <span>
          <Coins />
          <strong>{evidence.recorded_cost}</strong>
        </span>
      </div>
      <Link className="case-link" href={`/repairs/${repair.id}`}>
        View repair evidence <ArrowUpRight />
      </Link>
    </article>
  );
}

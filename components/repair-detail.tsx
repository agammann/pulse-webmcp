'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Coins,
  ExternalLink,
  Heart,
  LoaderCircle,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Wrench,
} from 'lucide-react';
import { RepairEditor } from './repair-editor';
import type { RepairCase } from '@/lib/domain';
import { outcomeLabel, safetyLabel } from '@/lib/domain';

export function RepairDetail({ initialRepair }: { initialRepair: RepairCase }) {
  const [repair, setRepair] = useState(initialRepair);
  const [busy, setBusy] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/repairs/${repair.id}`);
      const data = (await response.json()) as {
        repair: RepairCase;
        can_edit: boolean;
      };
      if (!response.ok) throw new Error('Could not refresh this case.');
      setRepair(data.repair);
      setCanEdit(data.can_edit);
    } catch {
      setNotice('Could not refresh. The last loaded case is shown.');
    }
  }, [repair.id]);
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    const onMutation = (event: Event) => {
      const detail = (event as CustomEvent<{ repair?: RepairCase }>).detail;
      if (detail?.repair?.id !== repair.id) return;
      setRepair(detail.repair);
      setNotice('This case was saved.');
    };
    window.addEventListener('pulse:mutated', onMutation);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pulse:mutated', onMutation);
    };
  }, [refresh, repair.id]);

  const vote = async (voteType: string) => {
    setBusy(voteType);
    setNotice('');
    try {
      const response = await fetch(`/api/repairs/${repair.id}/votes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType }),
      });
      const data = (await response.json()) as {
        repair: RepairCase;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? 'Vote failed.');
      setRepair(data.repair);
      setNotice(
        'Your feedback is saved. Repeating the same feedback in this browser counts once.',
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Could not save your feedback.',
      );
    } finally {
      setBusy('');
    }
  };

  const professional =
    repair.safety_classification === 'professional_recommended';
  return (
    <div className="detail-shell">
      <section className="detail-main">
        <div className="detail-kicker">
          <span className="mono-label">
            {repair.id}{' '}
            {repair.demo_record
              ? '· EXAMPLE / PRACTICE CASE'
              : '· COMMUNITY CASE'}
          </span>
          <span className={`safety-badge ${repair.safety_classification}`}>
            <ShieldCheck /> {safetyLabel(repair.safety_classification)}
          </span>
        </div>
        <h1>{repair.problem_description}</h1>
        <p className="detail-product">
          {repair.brand} {repair.product_name} <span>·</span> {repair.model}{' '}
          <span>·</span> {repair.category}
        </p>
        <div className="tag-list detail-tags">
          {repair.symptoms.map((symptom) => (
            <span key={symptom}>{symptom}</span>
          ))}
        </div>
        {notice && (
          <div className="success-notice">
            <CheckCircle2 /> {notice}
          </div>
        )}
        {professional && (
          <div className="professional-banner">
            <AlertTriangle />
            <div>
              <strong>Qualified service recommended</strong>
              <p>
                This case is available for history and evidence only. Pulse does
                not provide procedural instructions for mains electricity, gas,
                high-voltage, critical vehicle systems, structural repair, or
                hazardous materials.
              </p>
            </div>
          </div>
        )}

        <section className="timeline-section">
          <div className="section-heading">
            <div>
              <p className="mono-label">CHECKS, ATTEMPTS & OUTCOME</p>
              <h2>Diagnostic timeline</h2>
            </div>
            <span>{repair.diagnostic_steps.length} recorded tests</span>
          </div>
          <ol className="timeline">
            <li className="complete">
              <span>
                <Check />
              </span>
              <div>
                <small>Problem reported</small>
                <strong>{repair.problem_description}</strong>
                <p>Symptoms: {repair.symptoms.join(', ')}</p>
              </div>
            </li>
            {repair.diagnostic_steps.map((step) => (
              <li
                key={step.id}
                className={step.status === 'completed' ? 'complete' : 'current'}
              >
                <span>
                  {step.status === 'completed' ? <Check /> : <Circle />}
                </span>
                <div>
                  <small>Diagnostic test {step.sequence}</small>
                  <strong>{step.test}</strong>
                  <p>{step.reason}</p>
                  <div className="observation">
                    <b>Expected</b> {step.expected_result}
                  </div>
                  {step.observed_result && (
                    <div className="observation result">
                      <b>Observed by human</b> {step.observed_result}
                      {step.notes && <em>{step.notes}</em>}
                    </div>
                  )}
                </div>
              </li>
            ))}
            {repair.repair_attempts.map((attempt) => (
              <li key={attempt.id} className="complete">
                <span>
                  <Wrench />
                </span>
                <div>
                  <small>Repair attempted</small>
                  <strong>{attempt.repair_description}</strong>
                  <p>
                    Parts: {attempt.parts_used.join(', ') || 'No parts'} ·
                    Estimated ${attempt.estimated_cost} · {attempt.difficulty}
                  </p>
                </div>
              </li>
            ))}
            <li className={repair.outcome ? 'complete outcome' : 'pending'}>
              <span>{repair.outcome ? <CheckCircle2 /> : <Circle />}</span>
              <div>
                <small>Outcome</small>
                <strong>
                  {repair.outcome
                    ? outcomeLabel(repair.outcome.outcome)
                    : 'Awaiting a reported outcome'}
                </strong>
                {repair.outcome && (
                  <>
                    <p>{repair.outcome.final_fix}</p>
                    {repair.outcome.notes && (
                      <p>Notes: {repair.outcome.notes}</p>
                    )}
                    <div className="outcome-facts">
                      <span>
                        <Coins /> ${repair.outcome.cost}
                      </span>
                      <span>
                        <Clock3 /> {repair.outcome.time_minutes} minutes
                      </span>
                    </div>
                  </>
                )}
              </div>
            </li>
          </ol>
        </section>
        <a
          className="secondary-button"
          href={`/api/repairs/${repair.id}/export`}
          download
        >
          Export case JSON
        </a>
        {canEdit ? (
          <RepairEditor repair={repair} saved={setRepair} />
        ) : (
          <p className="inline-notice">
            Read-only in this browser. Cases can be edited in the browser that
            created them. Shared examples and older cases remain readable.
          </p>
        )}
      </section>

      <aside className="detail-side">
        <section className="evidence-summary">
          <p className="mono-label">REPAIR EVIDENCE</p>
          <h2>
            {repair.demo_record ? 'Example feedback' : 'Reported feedback'}
          </h2>
          <div className="evidence-big">
            <strong>{repair.votes.helpful}</strong>
            <span>helpful votes (self-reported)</span>
          </div>
          <div className="bar-row">
            <span>
              Worked for me <b>{repair.votes.worked_for_me}</b>
            </span>
            <div>
              <i
                style={{
                  width: `${Math.min(100, (repair.votes.worked_for_me / Math.max(1, repair.votes.worked_for_me + repair.votes.did_not_work)) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="bar-row negative">
            <span>
              Did not work <b>{repair.votes.did_not_work}</b>
            </span>
            <div>
              <i
                style={{
                  width: `${Math.min(100, (repair.votes.did_not_work / Math.max(1, repair.votes.worked_for_me + repair.votes.did_not_work)) * 100)}%`,
                }}
              />
            </div>
          </div>
          {repair.outcome && (
            <div className="evidence-facts">
              <span>
                Recorded outcome
                <strong>{outcomeLabel(repair.outcome.outcome)}</strong>
              </span>
              <span>
                Repair time<strong>{repair.outcome.time_minutes} min</strong>
              </span>
              <span>
                Actual cost<strong>${repair.outcome.cost}</strong>
              </span>
              <span>
                Difficulty<strong>{repair.difficulty}</strong>
              </span>
            </div>
          )}
        </section>
        <section className="verification-card">
          <h3>Did this evidence help?</h3>
          <p>Add your result to the shared repair memory.</p>
          <button disabled={Boolean(busy)} onClick={() => vote('helpful')}>
            {busy === 'helpful' ? <LoaderCircle className="spin" /> : <Heart />}{' '}
            Helpful
          </button>
          <button
            disabled={Boolean(busy)}
            onClick={() => vote('worked_for_me')}
          >
            {busy === 'worked_for_me' ? (
              <LoaderCircle className="spin" />
            ) : (
              <ThumbsUp />
            )}{' '}
            Worked for me
          </button>
          <button disabled={Boolean(busy)} onClick={() => vote('did_not_work')}>
            {busy === 'did_not_work' ? (
              <LoaderCircle className="spin" />
            ) : (
              <ThumbsDown />
            )}{' '}
            Did not work
          </button>
        </section>
        <section className="agent-prompt-card">
          <p className="mono-label">TRY WITH YOUR AGENT</p>
          <h3>Continue this repair with WebMCP</h3>
          <code>
            “Open {repair.id} and summarize the recorded evidence and unanswered
            questions.”
          </code>
          <Link href="/webmcp">
            See agent usage <ExternalLink />
          </Link>
        </section>
      </aside>
    </div>
  );
}

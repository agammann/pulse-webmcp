'use client';
import { useState, type SyntheticEvent } from 'react';
import type { RepairCase } from '@/lib/domain';
import { OUTCOMES, outcomeLabel } from '@/lib/domain';

export function RepairEditor({
  repair,
  saved,
}: {
  repair: RepairCase;
  saved: (repair: RepairCase) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  async function submit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
    action: string,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const data: Record<string, unknown> = Object.fromEntries(
      new FormData(form),
    );
    for (const field of ['cost', 'estimated_cost', 'time_minutes'])
      if (field in data) data[field] = Number(data[field]);
    if ('parts_used' in data)
      data.parts_used = String(data.parts_used)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch(`/api/repairs/${repair.id}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as {
        repair: RepairCase;
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error ?? 'Could not save this change.');
      saved(result.repair);
      form.reset();
      setNotice('Saved to the public case.');
      window.dispatchEvent(
        new CustomEvent('pulse:mutated', {
          detail: {
            description: `Saved ${action} for ${repair.id}`,
            repair: result.repair,
          },
        }),
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Could not save. Your entries are still here.',
      );
    } finally {
      setBusy(false);
    }
  }
  const submitButton = (label: string) => (
    <button type="submit" disabled={busy}>
      {busy ? 'Saving…' : label}
    </button>
  );
  return (
    <section className="case-editor" aria-label="Continue this case">
      <p className="mono-label">YOUR REPAIR JOURNAL</p>
      <h2>Continue this case</h2>
      <p>
        Entries are public. Record only what was actually observed or attempted.
        This browser holds the edit key. Clearing cookies loses editing access;
        exports contain only journal data.
      </p>
      {notice && <output className="inline-notice">{notice}</output>}
      {repair.safety_classification !== 'professional_recommended' && (
        <details>
          <summary>1. Propose a diagnostic check</summary>
          <form onSubmit={(e) => void submit(e, 'steps')}>
            <label>
              Diagnostic check
              <textarea name="test" minLength={5} maxLength={500} required />
            </label>
            <label>
              Expected result
              <input
                name="expected_result"
                minLength={2}
                maxLength={500}
                required
              />
            </label>
            <label>
              Reason for this check
              <textarea name="reason" minLength={5} maxLength={500} required />
            </label>
            {submitButton('Save diagnostic check')}
          </form>
        </details>
      )}
      {repair.diagnostic_steps.length > 0 && (
        <details>
          <summary>2. Record an observation</summary>
          <form onSubmit={(e) => void submit(e, 'results')}>
            <label>
              Diagnostic step
              <select name="step_id">
                {repair.diagnostic_steps.map((step) => (
                  <option value={step.id} key={step.id}>
                    {step.sequence}. {step.test}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Observed result
              <textarea
                name="observed_result"
                minLength={2}
                maxLength={800}
                required
              />
            </label>
            <label>
              Observation notes
              <textarea name="notes" maxLength={800} />
            </label>
            {submitButton('Save observation')}
          </form>
        </details>
      )}
      <details>
        <summary>3. Record a repair attempt</summary>
        <form onSubmit={(e) => void submit(e, 'attempts')}>
          <label>
            What was attempted
            <textarea
              name="repair_description"
              minLength={5}
              maxLength={800}
              required
            />
          </label>
          <label>
            Parts used (comma separated)
            <input name="parts_used" maxLength={1400} />
          </label>
          <label>
            Estimated cost (USD)
            <input
              name="estimated_cost"
              type="number"
              min="0"
              max="50000"
              step="0.01"
              required
            />
          </label>
          <label>
            Attempt difficulty
            <select name="difficulty">
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          {submitButton('Save repair attempt')}
        </form>
      </details>
      <details>
        <summary>4. Record or correct the outcome</summary>
        <form onSubmit={(e) => void submit(e, 'outcome')}>
          <p>
            Saving replaces the current outcome. Earlier diagnostic checks and
            attempts remain.
          </p>
          <label>
            Outcome
            <select
              name="outcome"
              defaultValue={repair.outcome?.outcome ?? 'not_fixed'}
            >
              {OUTCOMES.map((value) => (
                <option key={value} value={value}>
                  {outcomeLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Final fix or conclusion
            <textarea
              name="final_fix"
              minLength={2}
              maxLength={1000}
              required
            />
          </label>
          <label>
            Total cost (USD)
            <input
              name="cost"
              type="number"
              min="0"
              max="50000"
              step="0.01"
              required
            />
          </label>
          <label>
            Time spent (whole minutes)
            <input
              name="time_minutes"
              type="number"
              min="0"
              max="100000"
              step="1"
              required
            />
          </label>
          <label>
            Outcome notes
            <textarea name="notes" maxLength={1000} />
          </label>
          {submitButton('Save outcome')}
        </form>
      </details>
    </section>
  );
}

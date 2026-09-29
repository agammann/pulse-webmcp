'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { RepairCase } from '@/lib/domain';

export function NewRepairForm() {
  const [safety, setSafety] = useState('low_risk');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ id: string } | null>(null);

  const submit = async (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const value = (name: string) => {
      const entry = form.get(name);
      return typeof entry === 'string' ? entry : '';
    };
    const input = {
      practice: form.get('practice') === 'on',
      category: value('category'),
      brand: value('brand'),
      model: value('model'),
      product_name: value('product_name'),
      problem_description: value('problem_description'),
      symptoms: value('symptoms')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      safety_classification: value('safety_classification'),
      difficulty: value('difficulty'),
    };
    try {
      const response = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = (await response.json()) as {
        repair: RepairCase;
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error ?? 'The repair could not be created.');
      setCreated(data.repair);
      window.dispatchEvent(
        new CustomEvent('pulse:mutated', {
          detail: {
            description: `Human created ${data.repair.id}`,
            repair: data.repair,
          },
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The repair could not be created.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (created)
    return (
      <div className="creation-success">
        <CheckCircle2 />
        <p className="mono-label">REPAIR CASE CREATED</p>
        <h2>{created.id} is ready for a human + agent repair trail.</h2>
        <p>
          The case now appears in the public repair memory. Open it to add
          checks, observations, attempts, and outcomes yourself or with your
          agent. Keep this browser’s cookies to retain editing access.
        </p>
        <Link href={`/repairs/${created.id}`}>
          Open repair case <ArrowRight />
        </Link>
      </div>
    );

  return (
    <form className="new-repair-form" onSubmit={submit}>
      <div className="form-section">
        <div className="form-section-number">01</div>
        <div>
          <p className="mono-label">IDENTIFY THE OBJECT</p>
          <h2>What are we repairing?</h2>
          <div className="form-grid">
            <label>
              Category
              <input
                name="category"
                placeholder="Game controllers"
                maxLength={80}
                required
              />
            </label>
            <label>
              Brand
              <input name="brand" placeholder="Sony" maxLength={80} required />
            </label>
            <label>
              Model
              <input
                name="model"
                placeholder="CFI-ZCT1W"
                maxLength={100}
                required
              />
            </label>
            <label>
              Product name
              <input
                name="product_name"
                placeholder="DualSense Wireless Controller"
                maxLength={120}
                required
              />
            </label>
          </div>
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-number">02</div>
        <div>
          <p className="mono-label">DESCRIBE THE EVIDENCE</p>
          <h2>What is happening?</h2>
          <label>
            Problem description
            <textarea
              name="problem_description"
              placeholder="The left analog stick slowly drifts upward even when I am not touching it…"
              minLength={8}
              maxLength={1200}
              required
            />
          </label>
          <label>
            Symptoms <small>Separate with commas</small>
            <input
              name="symptoms"
              placeholder="stick drift, ghost input, left stick"
              required
            />
          </label>
          <div className="form-grid">
            <label>
              Estimated difficulty
              <select name="difficulty" defaultValue="moderate">
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-number">03</div>
        <div>
          <p className="mono-label">SET A SAFETY BOUNDARY</p>
          <h2>How should this case be handled?</h2>
          <div className="safety-options">
            <label className={safety === 'low_risk' ? 'selected' : ''}>
              <input
                type="radio"
                name="safety_classification"
                value="low_risk"
                checked={safety === 'low_risk'}
                onChange={() => setSafety('low_risk')}
              />
              <ShieldCheck />
              <span>
                <strong>Low risk</strong>
                <small>
                  External cleaning, adjustment, accessories, non-powered parts.
                </small>
              </span>
            </label>
            <label className={safety === 'moderate_risk' ? 'selected' : ''}>
              <input
                type="radio"
                name="safety_classification"
                value="moderate_risk"
                checked={safety === 'moderate_risk'}
                onChange={() => setSafety('moderate_risk')}
              />
              <Sparkles />
              <span>
                <strong>Moderate risk</strong>
                <small>
                  Opening consumer electronics, batteries, internal repair.
                </small>
              </span>
            </label>
            <label
              className={
                safety === 'professional_recommended' ? 'selected' : ''
              }
            >
              <input
                type="radio"
                name="safety_classification"
                value="professional_recommended"
                checked={safety === 'professional_recommended'}
                onChange={() => setSafety('professional_recommended')}
              />
              <AlertTriangle />
              <span>
                <strong>Professional recommended</strong>
                <small>
                  Mains, gas, high voltage, critical vehicle or structural
                  systems.
                </small>
              </span>
            </label>
          </div>
          {safety === 'professional_recommended' && (
            <div className="professional-inline">
              <AlertTriangle />
              Pulse will preserve the case history but will not provide
              dangerous procedural instructions. Qualified service is
              recommended.
            </div>
          )}
        </div>
      </div>
      <div className="inline-notice">
        <strong>Everything you save is public.</strong> Avoid names, addresses,
        contact information, and serial numbers. Editing is tied to this
        browser’s cookie; clearing it removes your edit access. Exports preserve
        a readable copy, not the edit key.
      </div>
      <label className="practice-choice">
        <input type="checkbox" name="practice" /> This is a practice case with
        fictional data. Exclude it from community statistics.
      </label>
      {error && (
        <div className="form-error">
          <AlertTriangle />
          {error}
        </div>
      )}
      <div className="form-submit">
        <span>Only publish details you want others to read.</span>
        <button disabled={loading} type="submit">
          {loading ? (
            <>
              <LoaderCircle className="spin" /> Creating case…
            </>
          ) : (
            <>
              Create repair case <ArrowRight />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

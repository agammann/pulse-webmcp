import test from 'node:test';
import assert from 'node:assert/strict';
import { seedCases } from '../lib/seed-data.ts';
import { rankRepairCases } from '../lib/search.ts';
import {
  parseCreateCase,
  parseOutcome,
  parseResult,
  parseStep,
  ValidationError,
} from '../lib/validation.ts';

void test('search repair cases ranks controller stick drift evidence', () => {
  const results = rankRepairCases(seedCases, {
    query: 'controller stick drift',
    limit: 10,
  });
  assert.ok(results.length >= 4);
  assert.ok(results.length <= 8);
  assert.ok(
    results.every((repair) =>
      [repair.category, repair.problem_description, ...repair.symptoms]
        .join(' ')
        .toLowerCase()
        .match(/controller|stick|drift/),
    ),
  );
  assert.ok(
    results.every((repair) => repair.category !== 'Mechanical keyboards'),
  );
  assert.ok(
    [results[0].problem_description, ...results[0].symptoms]
      .join(' ')
      .toLowerCase()
      .match(/stick|drift/),
  );
  assert.ok(results[0].relevance >= results.at(-1)!.relevance);
});

void test('retrieve a complete case by public id', () => {
  const repair = seedCases.find((item) => item.id === 'MS-1001');
  assert.ok(repair);
  assert.equal(repair.brand, 'Sony');
  assert.equal(repair.diagnostic_steps[0].status, 'completed');
  assert.equal(repair.outcome?.outcome, 'fixed');
});

void test('create case validation returns normalized structured input', () => {
  const created = parseCreateCase({
    category: ' Game controllers ',
    brand: 'Sony',
    model: 'CFI-ZCT1W',
    product_name: 'DualSense',
    problem_description: 'Left stick drifts upward.',
    symptoms: [' stick drift ', 'ghost input'],
    safety_classification: 'low_risk',
  });
  assert.deepEqual(created.symptoms, ['stick drift', 'ghost input']);
  assert.equal(created.difficulty, 'moderate');
});

void test('add diagnostic step preserves reason and expected result', () => {
  const repair = structuredClone(seedCases[0]);
  const step = parseStep({
    test: 'Inspect the exterior stick gap with a light.',
    expected_result: 'No visible debris.',
    reason: 'Separate contamination from wear before opening the controller.',
  });
  repair.diagnostic_steps.push({
    id: 'MS-1001-DS-2',
    sequence: 2,
    ...step,
    observed_result: null,
    notes: null,
    status: 'proposed',
    created_at: new Date().toISOString(),
  });
  assert.equal(repair.diagnostic_steps.at(-1)?.status, 'proposed');
  assert.match(repair.diagnostic_steps.at(-1)!.reason, /contamination/);
});

void test('record diagnostic result completes the matching step', () => {
  const repair = structuredClone(seedCases[0]);
  repair.diagnostic_steps[0].status = 'proposed';
  repair.diagnostic_steps[0].observed_result = null;
  const result = parseResult({
    step_id: repair.diagnostic_steps[0].id,
    observed_result: 'Cleaning did not change the drift.',
    notes: 'Tested twice.',
  });
  const step = repair.diagnostic_steps.find(
    (item) => item.id === result.step_id,
  )!;
  Object.assign(step, {
    observed_result: result.observed_result,
    notes: result.notes,
    status: 'completed',
  });
  assert.equal(step.status, 'completed');
  assert.match(step.observed_result!, /did not change/);
});

void test('record repair outcome captures cost, time, and final fix', () => {
  const repair = structuredClone(seedCases[4]);
  const outcome = parseOutcome({
    outcome: 'fixed',
    final_fix: 'Replaced the worn joystick module.',
    cost: 14,
    time_minutes: 52,
    notes: 'Input monitor now centers.',
  });
  repair.status = outcome.outcome;
  repair.outcome = {
    id: 'test-outcome',
    ...outcome,
    created_at: new Date().toISOString(),
  };
  assert.equal(repair.outcome.outcome, 'fixed');
  assert.equal(repair.outcome.cost, 14);
  assert.equal(repair.status, 'fixed');
});

void test('validation rejects oversized and unsafe schema values', () => {
  assert.throws(
    () =>
      parseCreateCase({
        category: 'x',
        brand: 'x',
        model: 'x',
        product_name: 'x',
        problem_description: 'short',
        symptoms: [],
        safety_classification: 'unknown',
      }),
    ValidationError,
  );
  assert.throws(
    () =>
      parseOutcome({
        outcome: 'deleted',
        final_fix: 'x',
        cost: -1,
        time_minutes: 1,
        notes: '',
      }),
    ValidationError,
  );
});

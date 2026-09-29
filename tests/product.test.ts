import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeCases } from '../lib/statistics.ts';
import { seedCases } from '../lib/seed-data.ts';
import { rankRepairCases } from '../lib/search.ts';
import { parseCreateCase, parseOutcome } from '../lib/validation.ts';
import { webMcpToolContracts } from '../lib/webmcp-contracts.ts';
import { validateToolInput } from '../lib/tool-input.ts';
import { readSession } from '../lib/session.ts';

void test('statistics exclude examples, cover over 50 cases and use only completed outcomes', () => {
  const cases = Array.from({ length: 63 }, (_, index) => ({
    ...structuredClone(seedCases[0]),
    id: `MS-${index}`,
    demo_record: false,
  }));
  cases[0].outcome = null;
  const stats = summarizeCases([...cases, ...seedCases]);
  assert.equal(stats.total_repair_cases, 63);
  assert.equal(stats.completed_cases, 62);
  assert.equal(stats.success_rate, 100);
  assert.equal(stats.example_cases, 30);
  assert.equal(stats.median_recorded_cost, cases[1].outcome?.cost);
  assert.equal(summarizeCases(seedCases).success_rate, null);
});
void test('examples are an explicit search source and recorded cost is not a made-up range', () => {
  assert.equal(rankRepairCases(seedCases, { source: 'community' }).length, 0);
  const [result] = rankRepairCases(seedCases, {
    source: 'examples',
    query: 'stick, drift!',
  });
  assert.ok(result);
  assert.equal(result.evidence.recorded_cost, `$${result.outcome?.cost}`);
});
void test('practice flag and integer time are validated', () => {
  const input = { ...seedCases[0], practice: true };
  assert.equal(parseCreateCase(input).practice, true);
  assert.throws(() => parseCreateCase({ ...input, practice: 'true' }));
  assert.throws(() =>
    parseOutcome({ ...seedCases[0].outcome, time_minutes: 1.5 }),
  );
});
void test('tool input validation rejects wrong types, unknown keys and out-of-range search', () => {
  assert.throws(() =>
    validateToolInput(webMcpToolContracts.searchRepairs.inputSchema, {
      limit: 21,
    }),
  );
  assert.throws(() =>
    validateToolInput(webMcpToolContracts.searchRepairs.inputSchema, {
      source: 'fake',
    }),
  );
  assert.throws(() =>
    validateToolInput(webMcpToolContracts.getRepairStatistics.inputSchema, {
      extra: true,
    }),
  );
  assert.throws(() =>
    validateToolInput(webMcpToolContracts.getRepairCase.inputSchema, {}),
  );
  validateToolInput(webMcpToolContracts.searchRepairs.inputSchema, {
    source: 'examples',
    limit: 20,
  });
});
void test('browser editing key is opaque, hashed, and stable across requests', async () => {
  const session = (await readSession(new Request('https://pulse.test'), true))!;
  assert.match(session.cookie, /HttpOnly; SameSite=Strict/);
  assert.match(session.cookie, /Secure/);
  assert.ok(!session.cookie.includes(session.id));
  const restored = await readSession(
    new Request('https://pulse.test', { headers: { cookie: session.cookie } }),
    false,
  );
  assert.equal(restored?.id, session.id);
  assert.equal(
    await readSession(new Request('https://pulse.test'), false),
    null,
  );
});

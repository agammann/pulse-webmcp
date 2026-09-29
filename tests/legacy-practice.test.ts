import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { legacyPracticeMigration } from '../lib/legacy-practice.ts';

void test('legacy migration only relabels the exact verified fixture and is idempotent', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(
    'CREATE TABLE products (id TEXT PRIMARY KEY, brand TEXT, model TEXT); CREATE TABLE repair_cases (id TEXT PRIMARY KEY, product_id TEXT, problem_description TEXT, demo_record INTEGER);',
  );
  db.prepare('INSERT INTO products VALUES (?, ?, ?)').run(
    'p',
    'MendSignal QA',
    'WEBMCP-SMOKE-20260829',
  );
  const text =
    'Clearly labeled production smoke test: left analog stick drifts upward in the input monitor.';
  const insert = db.prepare('INSERT INTO repair_cases VALUES (?, ?, ?, ?)');
  insert.run('MS-FF8FKZ', 'p', text, 0);
  insert.run('MS-OTHER', 'p', text, 0);
  db.exec(legacyPracticeMigration);
  db.exec(legacyPracticeMigration);
  const rows = db
    .prepare('SELECT id, demo_record FROM repair_cases ORDER BY id')
    .all();
  assert.equal(rows[0].demo_record, 1);
  assert.equal(rows[1].demo_record, 0);
  db.prepare(
    'UPDATE repair_cases SET demo_record = 0, problem_description = ? WHERE id = ?',
  ).run('Actual community report', 'MS-FF8FKZ');
  db.exec(legacyPracticeMigration);
  assert.equal(
    db
      .prepare('SELECT demo_record FROM repair_cases WHERE id = ?')
      .get('MS-FF8FKZ')?.demo_record,
    0,
  );
  db.close();
});

import { env } from 'cloudflare:workers';
import { legacyPracticeMigration } from './legacy-practice';
import { seedCases } from './seed-data';
import type { AgentActivity, RepairCase, RepairSearchResult } from './domain';
import { summarizeCases } from './statistics';
import { rankRepairCases } from './search';

type D1Row = Record<string, string | number | boolean | null>;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS case_owners (repair_case_id TEXT PRIMARY KEY, session_hash TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS browser_votes (repair_case_id TEXT NOT NULL, session_hash TEXT NOT NULL, vote_type TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(repair_case_id, session_hash, vote_type))`,
  `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, category TEXT NOT NULL, brand TEXT NOT NULL, model TEXT NOT NULL, product_name TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS repair_cases (id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id), problem_description TEXT NOT NULL, symptoms TEXT NOT NULL, status TEXT NOT NULL, safety_classification TEXT NOT NULL, difficulty TEXT NOT NULL, demo_record INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS diagnostic_steps (id TEXT PRIMARY KEY, repair_case_id TEXT NOT NULL REFERENCES repair_cases(id), sequence INTEGER NOT NULL, test TEXT NOT NULL, reason TEXT NOT NULL, expected_result TEXT NOT NULL, observed_result TEXT, notes TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS repair_attempts (id TEXT PRIMARY KEY, repair_case_id TEXT NOT NULL REFERENCES repair_cases(id), repair_description TEXT NOT NULL, parts_used TEXT NOT NULL, estimated_cost REAL NOT NULL, difficulty TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS repair_outcomes (id TEXT PRIMARY KEY, repair_case_id TEXT NOT NULL REFERENCES repair_cases(id), outcome TEXT NOT NULL, final_fix TEXT NOT NULL, actual_cost REAL NOT NULL, time_minutes INTEGER NOT NULL, notes TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS votes (id TEXT PRIMARY KEY, repair_case_id TEXT NOT NULL REFERENCES repair_cases(id), vote_type TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS agent_activity (id TEXT PRIMARY KEY, repair_case_id TEXT, tool_name TEXT NOT NULL, description TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_cases_product ON repair_cases(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cases_status ON repair_cases(status)`,
  `CREATE INDEX IF NOT EXISTS idx_steps_case ON diagnostic_steps(repair_case_id, sequence)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_case ON repair_attempts(repair_case_id)`,
  `CREATE INDEX IF NOT EXISTS idx_outcomes_case ON repair_outcomes(repair_case_id)`,
  `CREATE INDEX IF NOT EXISTS idx_votes_case_type ON votes(repair_case_id, vote_type)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_created ON agent_activity(created_at DESC)`,
];

const getD1 = () => {
  if (!env.DB) throw new Error('Repair database is unavailable.');
  return env.DB;
};

const batchInChunks = async (statements: D1PreparedStatement[], size = 75) => {
  const db = getD1();
  for (let index = 0; index < statements.length; index += size)
    await db.batch(statements.slice(index, index + size));
};

let ready: Promise<void> | null = null;
export const ensureDatabase = async () => {
  if (ready) return ready;
  ready = (async () => {
    const db = getD1();
    await batchInChunks(
      [...schemaStatements, legacyPracticeMigration].map((statement) =>
        db.prepare(statement),
      ),
    );
    const existing = await db
      .prepare('SELECT COUNT(*) AS count FROM repair_cases')
      .first<{ count: number }>();
    if ((existing?.count ?? 0) > 0) return;

    const writes: D1PreparedStatement[] = [];
    for (const item of seedCases) {
      const productId = `P-${item.id}`;
      writes.push(
        db
          .prepare(
            'INSERT OR IGNORE INTO products (id, category, brand, model, product_name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          )
          .bind(
            productId,
            item.category,
            item.brand,
            item.model,
            item.product_name,
            item.created_at,
          ),
      );
      writes.push(
        db
          .prepare(
            'INSERT OR IGNORE INTO repair_cases (id, product_id, problem_description, symptoms, status, safety_classification, difficulty, demo_record, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          )
          .bind(
            item.id,
            productId,
            item.problem_description,
            JSON.stringify(item.symptoms),
            item.status,
            item.safety_classification,
            item.difficulty,
            1,
            item.created_at,
            item.updated_at,
          ),
      );
      for (const step of item.diagnostic_steps)
        writes.push(
          db
            .prepare(
              'INSERT OR IGNORE INTO diagnostic_steps (id, repair_case_id, sequence, test, reason, expected_result, observed_result, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            )
            .bind(
              step.id,
              item.id,
              step.sequence,
              step.test,
              step.reason,
              step.expected_result,
              step.observed_result,
              step.notes,
              step.status,
              step.created_at,
            ),
        );
      for (const attempt of item.repair_attempts)
        writes.push(
          db
            .prepare(
              'INSERT OR IGNORE INTO repair_attempts (id, repair_case_id, repair_description, parts_used, estimated_cost, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            )
            .bind(
              attempt.id,
              item.id,
              attempt.repair_description,
              JSON.stringify(attempt.parts_used),
              attempt.estimated_cost,
              attempt.difficulty,
              attempt.created_at,
            ),
        );
      if (item.outcome)
        writes.push(
          db
            .prepare(
              'INSERT OR IGNORE INTO repair_outcomes (id, repair_case_id, outcome, final_fix, actual_cost, time_minutes, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            )
            .bind(
              item.outcome.id,
              item.id,
              item.outcome.outcome,
              item.outcome.final_fix,
              item.outcome.cost,
              item.outcome.time_minutes,
              item.outcome.notes,
              item.outcome.created_at,
            ),
        );
      for (const [voteType, count] of Object.entries(item.votes)) {
        for (let vote = 0; vote < count; vote += 1)
          writes.push(
            db
              .prepare(
                'INSERT OR IGNORE INTO votes (id, repair_case_id, vote_type, created_at) VALUES (?, ?, ?, ?)',
              )
              .bind(
                `${item.id}-${voteType}-${vote}`,
                item.id,
                voteType,
                item.updated_at,
              ),
          );
      }
    }
    await batchInChunks(writes);
    await db.prepare('PRAGMA optimize').run();
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
};

const baseQuery = `
  SELECT (SELECT COUNT(*) FROM repair_attempts a WHERE a.repair_case_id = rc.id) AS attempt_count, rc.id, p.category, p.brand, p.model, p.product_name,
    rc.problem_description, rc.symptoms, rc.status, rc.safety_classification,
    rc.difficulty, rc.demo_record, rc.created_at, rc.updated_at,
    ro.id AS outcome_id, ro.outcome, ro.final_fix, ro.actual_cost, ro.time_minutes, ro.notes AS outcome_notes, ro.created_at AS outcome_created_at,
    SUM(CASE WHEN v.vote_type = 'helpful' THEN 1 ELSE 0 END) AS helpful,
    SUM(CASE WHEN v.vote_type = 'worked_for_me' THEN 1 ELSE 0 END) AS worked_for_me,
    SUM(CASE WHEN v.vote_type = 'did_not_work' THEN 1 ELSE 0 END) AS did_not_work
  FROM repair_cases rc
  JOIN products p ON p.id = rc.product_id
  LEFT JOIN repair_outcomes ro ON ro.repair_case_id = rc.id
  LEFT JOIN (SELECT repair_case_id, vote_type FROM votes UNION ALL SELECT repair_case_id, vote_type FROM browser_votes) v ON v.repair_case_id = rc.id
`;

const rowToCase = (row: D1Row): RepairCase => ({
  id: String(row.id),
  category: String(row.category),
  brand: String(row.brand),
  model: String(row.model),
  product_name: String(row.product_name),
  problem_description: String(row.problem_description),
  symptoms: JSON.parse(String(row.symptoms)),
  status: String(row.status),
  safety_classification:
    row.safety_classification as RepairCase['safety_classification'],
  difficulty: row.difficulty as RepairCase['difficulty'],
  attempt_count: Number(row.attempt_count ?? 0),
  demo_record: Boolean(row.demo_record),
  created_at: String(row.created_at),
  updated_at: String(row.updated_at),
  diagnostic_steps: [],
  repair_attempts: [],
  outcome: row.outcome_id
    ? {
        id: String(row.outcome_id),
        outcome: row.outcome as NonNullable<RepairCase['outcome']>['outcome'],
        final_fix: String(row.final_fix),
        cost: Number(row.actual_cost),
        time_minutes: Number(row.time_minutes),
        notes: String(row.outcome_notes ?? ''),
        created_at: String(row.outcome_created_at),
      }
    : null,
  votes: {
    helpful: Number(row.helpful ?? 0),
    worked_for_me: Number(row.worked_for_me ?? 0),
    did_not_work: Number(row.did_not_work ?? 0),
  },
});

export async function allCases(): Promise<RepairCase[]> {
  await ensureDatabase();
  const rows = await getD1()
    .prepare(`${baseQuery} GROUP BY rc.id ORDER BY rc.updated_at DESC`)
    .all<D1Row>();
  return rows.results.map(rowToCase);
}
export async function searchRepairs(
  filters: Record<string, string | number | undefined>,
): Promise<RepairSearchResult[]> {
  return rankRepairCases(await allCases(), { source: 'community', ...filters });
}

export async function getRepairCase(id: string): Promise<RepairCase | null> {
  await ensureDatabase();
  const row = await getD1()
    .prepare(`${baseQuery} WHERE rc.id = ? GROUP BY rc.id`)
    .bind(id)
    .first<D1Row>();
  if (!row) return null;
  const item = rowToCase(row);
  const [steps, attempts] = await Promise.all([
    getD1()
      .prepare(
        'SELECT * FROM diagnostic_steps WHERE repair_case_id = ? ORDER BY sequence',
      )
      .bind(id)
      .all<D1Row>(),
    getD1()
      .prepare(
        'SELECT * FROM repair_attempts WHERE repair_case_id = ? ORDER BY created_at',
      )
      .bind(id)
      .all<D1Row>(),
  ]);
  item.diagnostic_steps = steps.results.map((step) => ({
    id: String(step.id),
    sequence: Number(step.sequence),
    test: String(step.test),
    reason: String(step.reason),
    expected_result: String(step.expected_result),
    observed_result:
      step.observed_result === null ? null : String(step.observed_result),
    notes: step.notes === null ? null : String(step.notes),
    status: step.status as 'proposed' | 'completed',
    created_at: String(step.created_at),
  }));
  item.repair_attempts = attempts.results.map((attempt) => ({
    id: String(attempt.id),
    repair_description: String(attempt.repair_description),
    parts_used: JSON.parse(String(attempt.parts_used)),
    estimated_cost: Number(attempt.estimated_cost),
    difficulty: attempt.difficulty as RepairCase['difficulty'],
    created_at: String(attempt.created_at),
  }));
  return item;
}

export async function logActivity(
  toolName: string,
  description: string,
  repairCaseId: string | null = null,
  actor: 'agent' | 'human' = 'agent',
) {
  await ensureDatabase();
  const activity: AgentActivity = {
    id: crypto.randomUUID(),
    repair_case_id: repairCaseId,
    tool_name: toolName,
    description,
    actor,
    created_at: new Date().toISOString(),
  };
  await getD1()
    .prepare(
      'INSERT INTO agent_activity (id, repair_case_id, tool_name, description, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(
      activity.id,
      activity.repair_case_id,
      activity.tool_name,
      activity.description,
      activity.actor,
      activity.created_at,
    )
    .run();
  return activity;
}

export async function recentActivity(limit = 12) {
  await ensureDatabase();
  const result = await getD1()
    .prepare('SELECT * FROM agent_activity ORDER BY created_at DESC LIMIT ?')
    .bind(Math.min(50, Math.max(1, limit)))
    .all<D1Row>();
  return result.results.map((row) => ({
    id: String(row.id),
    repair_case_id: row.repair_case_id ? String(row.repair_case_id) : null,
    tool_name: String(row.tool_name),
    description: String(row.description),
    actor: row.actor as 'agent' | 'human',
    created_at: String(row.created_at),
  }));
}

export async function createRepairCase(
  input: {
    category: string;
    brand: string;
    model: string;
    product_name: string;
    problem_description: string;
    symptoms: string[];
    safety_classification: string;
    difficulty: string;
    practice?: boolean;
  },
  sessionHash: string,
) {
  await ensureDatabase();
  const db = getD1();
  const id = `MS-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;
  const productId = `P-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        'INSERT OR IGNORE INTO products (id, category, brand, model, product_name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(
        productId,
        input.category,
        input.brand,
        input.model,
        input.product_name,
        now,
      ),
    db
      .prepare(
        'INSERT OR IGNORE INTO repair_cases (id, product_id, problem_description, symptoms, status, safety_classification, difficulty, demo_record, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        id,
        productId,
        input.problem_description,
        JSON.stringify(input.symptoms),
        'open',
        input.safety_classification,
        input.difficulty,
        input.practice ? 1 : 0,
        now,
        now,
      ),
    db
      .prepare(
        'INSERT INTO case_owners (repair_case_id, session_hash) VALUES (?, ?)',
      )
      .bind(id, sessionHash),
  ]);
  await logActivity('create_repair_case', `Created repair case ${id}`, id);
  return getRepairCase(id);
}

export async function addDiagnosticStep(
  caseId: string,
  input: { test: string; expected_result: string; reason: string },
) {
  await ensureDatabase();
  const exists = await getRepairCase(caseId);
  if (!exists) return null;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await getD1().batch([
    getD1()
      .prepare(
        'INSERT INTO diagnostic_steps (id, repair_case_id, sequence, test, reason, expected_result, status, created_at) SELECT ?, ?, COALESCE(MAX(sequence), 0) + 1, ?, ?, ?, ?, ? FROM diagnostic_steps WHERE repair_case_id = ?',
      )
      .bind(
        id,
        caseId,
        input.test,
        input.reason,
        input.expected_result,
        'proposed',
        now,
        caseId,
      ),
    getD1()
      .prepare('UPDATE repair_cases SET updated_at = ? WHERE id = ?')
      .bind(now, caseId),
  ]);
  await logActivity(
    'add_diagnostic_step',
    `Added diagnostic step to ${caseId}`,
    caseId,
  );
  return getRepairCase(caseId);
}

export async function addDiagnosticResult(
  caseId: string,
  input: { step_id: string; observed_result: string; notes: string },
) {
  await ensureDatabase();
  const result = await getD1()
    .prepare(
      'UPDATE diagnostic_steps SET observed_result = ?, notes = ?, status = ? WHERE id = ? AND repair_case_id = ?',
    )
    .bind(
      input.observed_result,
      input.notes,
      'completed',
      input.step_id,
      caseId,
    )
    .run();
  if (!result.meta.changes) return null;
  await getD1()
    .prepare('UPDATE repair_cases SET updated_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), caseId)
    .run();
  await logActivity(
    'add_diagnostic_result',
    `Human observation recorded for ${caseId}`,
    caseId,
    'human',
  );
  return getRepairCase(caseId);
}

export async function recordRepairAttempt(
  caseId: string,
  input: {
    repair_description: string;
    parts_used: string[];
    estimated_cost: number;
    difficulty: string;
  },
) {
  await ensureDatabase();
  if (!(await getRepairCase(caseId))) return null;
  const now = new Date().toISOString();
  await getD1()
    .prepare(
      'INSERT OR IGNORE INTO repair_attempts (id, repair_case_id, repair_description, parts_used, estimated_cost, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      crypto.randomUUID(),
      caseId,
      input.repair_description,
      JSON.stringify(input.parts_used),
      input.estimated_cost,
      input.difficulty,
      now,
    )
    .run();
  await getD1()
    .prepare('UPDATE repair_cases SET updated_at = ? WHERE id = ?')
    .bind(now, caseId)
    .run();
  await logActivity(
    'record_repair_attempt',
    `Recorded a repair attempt for ${caseId}`,
    caseId,
  );
  return getRepairCase(caseId);
}

export async function recordRepairOutcome(
  caseId: string,
  input: {
    outcome: string;
    final_fix: string;
    cost: number;
    time_minutes: number;
    notes: string;
  },
) {
  await ensureDatabase();
  if (!(await getRepairCase(caseId))) return null;
  const now = new Date().toISOString();
  const db = getD1();
  await db.batch([
    db
      .prepare('DELETE FROM repair_outcomes WHERE repair_case_id = ?')
      .bind(caseId),
    db
      .prepare(
        'INSERT OR IGNORE INTO repair_outcomes (id, repair_case_id, outcome, final_fix, actual_cost, time_minutes, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        crypto.randomUUID(),
        caseId,
        input.outcome,
        input.final_fix,
        input.cost,
        input.time_minutes,
        input.notes,
        now,
      ),
    db
      .prepare(
        'UPDATE repair_cases SET status = ?, updated_at = ? WHERE id = ?',
      )
      .bind(input.outcome, now, caseId),
  ]);
  await logActivity(
    'record_repair_outcome',
    `Recorded ${input.outcome.replaceAll('_', ' ')} for ${caseId}`,
    caseId,
  );
  return getRepairCase(caseId);
}

export async function markHelpful(
  caseId: string,
  voteType: string,
  sessionHash: string,
) {
  await ensureDatabase();
  if (!(await getRepairCase(caseId))) return null;
  const inserted = await getD1()
    .prepare(
      'INSERT OR IGNORE INTO browser_votes (repair_case_id, session_hash, vote_type, created_at) VALUES (?, ?, ?, ?)',
    )
    .bind(caseId, sessionHash, voteType, new Date().toISOString())
    .run();
  if (!inserted.meta.changes) return getRepairCase(caseId);
  await logActivity(
    'mark_case_helpful',
    `Community marked ${caseId} as ${voteType.replaceAll('_', ' ')}`,
    caseId,
    'human',
  );
  return getRepairCase(caseId);
}

export async function canEdit(caseId: string, sessionHash: string) {
  await ensureDatabase();
  return Boolean(
    await getD1()
      .prepare(
        'SELECT 1 FROM case_owners WHERE repair_case_id = ? AND session_hash = ?',
      )
      .bind(caseId, sessionHash)
      .first(),
  );
}
export async function statistics() {
  return summarizeCases(await allCases());
}

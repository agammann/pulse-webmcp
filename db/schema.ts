import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  productName: text('product_name').notNull(),
  createdAt: text('created_at').notNull(),
});

export const repairCases = sqliteTable('repair_cases', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  problemDescription: text('problem_description').notNull(),
  symptoms: text('symptoms').notNull(),
  status: text('status').notNull(),
  safetyClassification: text('safety_classification').notNull(),
  difficulty: text('difficulty').notNull(),
  demoRecord: integer('demo_record', { mode: 'boolean' })
    .notNull()
    .default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const diagnosticSteps = sqliteTable('diagnostic_steps', {
  id: text('id').primaryKey(),
  repairCaseId: text('repair_case_id')
    .notNull()
    .references(() => repairCases.id),
  sequence: integer('sequence').notNull(),
  test: text('test').notNull(),
  reason: text('reason').notNull(),
  expectedResult: text('expected_result').notNull(),
  observedResult: text('observed_result'),
  notes: text('notes'),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
});

export const repairAttempts = sqliteTable('repair_attempts', {
  id: text('id').primaryKey(),
  repairCaseId: text('repair_case_id')
    .notNull()
    .references(() => repairCases.id),
  repairDescription: text('repair_description').notNull(),
  partsUsed: text('parts_used').notNull(),
  estimatedCost: real('estimated_cost').notNull(),
  difficulty: text('difficulty').notNull(),
  createdAt: text('created_at').notNull(),
});

export const repairOutcomes = sqliteTable('repair_outcomes', {
  id: text('id').primaryKey(),
  repairCaseId: text('repair_case_id')
    .notNull()
    .references(() => repairCases.id),
  outcome: text('outcome').notNull(),
  finalFix: text('final_fix').notNull(),
  actualCost: real('actual_cost').notNull(),
  timeMinutes: integer('time_minutes').notNull(),
  notes: text('notes').notNull(),
  createdAt: text('created_at').notNull(),
});

export const votes = sqliteTable('votes', {
  id: text('id').primaryKey(),
  repairCaseId: text('repair_case_id')
    .notNull()
    .references(() => repairCases.id),
  voteType: text('vote_type').notNull(),
  createdAt: text('created_at').notNull(),
});

export const agentActivity = sqliteTable('agent_activity', {
  id: text('id').primaryKey(),
  repairCaseId: text('repair_case_id'),
  toolName: text('tool_name').notNull(),
  description: text('description').notNull(),
  actor: text('actor').notNull(),
  createdAt: text('created_at').notNull(),
});

export const caseOwners = sqliteTable('case_owners', {
  repairCaseId: text('repair_case_id').primaryKey(),
  sessionHash: text('session_hash').notNull(),
});

export const browserVotes = sqliteTable(
  'browser_votes',
  {
    repairCaseId: text('repair_case_id').notNull(),
    sessionHash: text('session_hash').notNull(),
    voteType: text('vote_type').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.repairCaseId, table.sessionHash, table.voteType],
    }),
  ],
);

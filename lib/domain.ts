export const SAFETY_LEVELS = [
  'low_risk',
  'moderate_risk',
  'professional_recommended',
] as const;
export const OUTCOMES = [
  'fixed',
  'improved',
  'not_fixed',
  'professional_repair_required',
  'replacement_required',
  'abandoned',
] as const;
export const DIFFICULTIES = ['easy', 'moderate', 'advanced'] as const;
export const VOTE_TYPES = ['helpful', 'worked_for_me', 'did_not_work'] as const;

export type SafetyClassification = (typeof SAFETY_LEVELS)[number];
export type RepairOutcome = (typeof OUTCOMES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type VoteType = (typeof VOTE_TYPES)[number];

export type DiagnosticStep = {
  id: string;
  sequence: number;
  test: string;
  reason: string;
  expected_result: string;
  observed_result: string | null;
  notes: string | null;
  status: 'proposed' | 'completed';
  created_at: string;
};

export type RepairAttempt = {
  id: string;
  repair_description: string;
  parts_used: string[];
  estimated_cost: number;
  difficulty: Difficulty;
  created_at: string;
};

export type OutcomeRecord = {
  id: string;
  outcome: RepairOutcome;
  final_fix: string;
  cost: number;
  time_minutes: number;
  notes: string;
  created_at: string;
};

export type VoteCounts = {
  helpful: number;
  worked_for_me: number;
  did_not_work: number;
};

export type RepairCase = {
  id: string;
  category: string;
  brand: string;
  model: string;
  product_name: string;
  problem_description: string;
  symptoms: string[];
  status: string;
  safety_classification: SafetyClassification;
  difficulty: Difficulty;
  demo_record: boolean;
  attempt_count?: number;
  created_at: string;
  updated_at: string;
  diagnostic_steps: DiagnosticStep[];
  repair_attempts: RepairAttempt[];
  outcome: OutcomeRecord | null;
  votes: VoteCounts;
};

export type RepairSearchResult = RepairCase & {
  relevance: number;
  evidence: {
    symptom_reports: number;
    attempts: number;
    fixed: number;
    improved: number;
    did_not_work: number;
    recorded_time_minutes: number;
    recorded_cost: string;
  };
};

export type AgentActivity = {
  id: string;
  repair_case_id: string | null;
  tool_name: string;
  description: string;
  actor: 'agent' | 'human';
  created_at: string;
};

export const safetyLabel = (value: SafetyClassification) =>
  ({
    low_risk: 'Low risk',
    moderate_risk: 'Moderate risk',
    professional_recommended: 'Professional recommended',
  })[value];

export const outcomeLabel = (value: RepairOutcome) =>
  ({
    fixed: 'Fixed',
    improved: 'Improved',
    not_fixed: 'Not fixed',
    professional_repair_required: 'Professional repair required',
    replacement_required: 'Replacement required',
    abandoned: 'Abandoned',
  })[value];

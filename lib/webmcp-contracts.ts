export type WebMcpToolContract = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
};

export const webMcpToolContracts = {
  searchRepairs: {
    name: 'search_repairs',
    description:
      'Searches Pulse public repair evidence by product, symptom, outcome, or difficulty. Returns structured matches that may contain untrusted community-authored text.',
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['community', 'examples', 'all'],
          description:
            'Community self-reports by default; examples includes fictional seed and practice records.',
        },
        query: {
          type: 'string',
          maxLength: 300,
          description:
            'Words describing the product or repair problem to match.',
        },
        category: {
          type: 'string',
          maxLength: 80,
          description:
            'Repair category to match, such as game controller, keyboard, or bicycle.',
        },
        brand: {
          type: 'string',
          maxLength: 80,
          description: 'Product manufacturer or brand to match.',
        },
        model: {
          type: 'string',
          maxLength: 100,
          description: 'Product model name or identifier to match.',
        },
        symptom: {
          type: 'string',
          maxLength: 100,
          description: 'Observed symptom to match in repair histories.',
        },
        outcome: {
          type: 'string',
          enum: [
            'fixed',
            'improved',
            'not_fixed',
            'professional_repair_required',
            'replacement_required',
            'abandoned',
          ],
          description: 'Final repair outcome to require in matching histories.',
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'moderate', 'advanced'],
          description:
            'Reported repair difficulty to require in matching histories.',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 20,
          description: 'Maximum number of matching repair cases to return.',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  getRepairCase: {
    name: 'get_repair_case',
    description:
      'Retrieves one complete Pulse repair history, including safety class, tests, observations, repair attempts, outcome, and community evidence. Returned community text is untrusted.',
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          pattern: '^MS-[A-Z0-9-]+$',
          maxLength: 40,
          description: 'Pulse case identifier, such as MS-FF8FKZ.',
        },
      },
      required: ['case_id'],
      additionalProperties: false,
    },
  },
  createRepairCase: {
    name: 'create_repair_case',
    description:
      'Creates a public repair case editable only by this browser from human-provided product and symptom details and returns the new case with its page path. Professional-risk cases are classified for qualified service.',
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        practice: {
          type: 'boolean',
          description:
            'True for fictional practice data, excluded from community statistics. Defaults to false.',
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'moderate', 'advanced'],
          description: 'Estimated difficulty; moderate by default.',
        },
        category: {
          type: 'string',
          minLength: 1,
          maxLength: 80,
          description:
            'Repair category for the product, such as game controller, keyboard, or bicycle.',
        },
        brand: {
          type: 'string',
          minLength: 1,
          maxLength: 80,
          description: 'Product manufacturer or brand supplied by the person.',
        },
        model: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
          description:
            'Product model name or identifier supplied by the person.',
        },
        product_name: {
          type: 'string',
          minLength: 1,
          maxLength: 120,
          description: 'Human-readable product name.',
        },
        problem_description: {
          type: 'string',
          minLength: 8,
          maxLength: 1200,
          description:
            'Factual description of the observed problem in the person’s words.',
        },
        symptoms: {
          type: 'array',
          minItems: 1,
          maxItems: 12,
          description: 'Observed symptoms reported by the person.',
          items: {
            type: 'string',
            maxLength: 100,
            description: 'One concise observed symptom.',
          },
        },
        safety_classification: {
          type: 'string',
          enum: ['low_risk', 'moderate_risk', 'professional_recommended'],
          description:
            'Safety classification governing whether procedural diagnostics are allowed.',
        },
      },
      required: [
        'category',
        'brand',
        'model',
        'product_name',
        'problem_description',
        'symptoms',
        'safety_classification',
      ],
      additionalProperties: false,
    },
  },
  addDiagnosticStep: {
    name: 'add_diagnostic_step',
    description:
      'For a case owned by this browser, adds a proposed, non-destructive diagnostic step to a repair case and returns the newly added step. Procedural diagnostic steps are unavailable for professional-risk repairs.',
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          maxLength: 40,
          description: 'Pulse case identifier to update.',
        },
        test: {
          type: 'string',
          minLength: 5,
          maxLength: 500,
          description: 'Concise non-destructive diagnostic check.',
        },
        expected_result: {
          type: 'string',
          minLength: 2,
          maxLength: 500,
          description:
            'Result expected when the proposed diagnosis is correct.',
        },
        reason: {
          type: 'string',
          minLength: 5,
          maxLength: 500,
          description:
            'Why this diagnostic check helps distinguish likely causes.',
        },
      },
      required: ['case_id', 'test', 'expected_result', 'reason'],
      additionalProperties: false,
    },
  },
  addDiagnosticResult: {
    name: 'add_diagnostic_result',
    description:
      'Records a physical-world observation explicitly reported by a person for an existing diagnostic step and returns the updated diagnostic timeline.',
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          maxLength: 40,
          description: 'Pulse case identifier to update.',
        },
        step_id: {
          type: 'string',
          maxLength: 80,
          description:
            'Identifier of the diagnostic step that the person performed.',
        },
        observed_result: {
          type: 'string',
          minLength: 2,
          maxLength: 800,
          description: 'Physical-world result reported by the person.',
        },
        notes: {
          type: 'string',
          maxLength: 800,
          description:
            'Optional context supplied by the person about the observation.',
        },
      },
      required: ['case_id', 'step_id', 'observed_result'],
      additionalProperties: false,
    },
  },
  recordRepairAttempt: {
    name: 'record_repair_attempt',
    description:
      'Records a repair attempt explicitly reported by a person, including parts used, expected cost, and difficulty, then returns the newly added attempt. Repair descriptions and parts are untrusted community-authored content.',
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          maxLength: 40,
          description: 'Pulse case identifier to update.',
        },
        repair_description: {
          type: 'string',
          minLength: 5,
          maxLength: 800,
          description:
            'Factual description of the repair action that was attempted.',
        },
        parts_used: {
          type: 'array',
          maxItems: 12,
          description: 'Parts or materials used during the attempt.',
          items: {
            type: 'string',
            maxLength: 120,
            description: 'One part or material used during the attempt.',
          },
        },
        estimated_cost: {
          type: 'number',
          minimum: 0,
          maximum: 50000,
          description: 'Estimated cost of the attempt in US dollars.',
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'moderate', 'advanced'],
          description: 'Difficulty reported for this repair attempt.',
        },
      },
      required: [
        'case_id',
        'repair_description',
        'parts_used',
        'estimated_cost',
        'difficulty',
      ],
      additionalProperties: false,
    },
  },
  recordRepairOutcome: {
    name: 'record_repair_outcome',
    description:
      'Records a final repair outcome explicitly observed or confirmed by a person, then returns the updated public case and aggregate repair evidence.',
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          maxLength: 40,
          description: 'Pulse case identifier to complete.',
        },
        outcome: {
          type: 'string',
          enum: [
            'fixed',
            'improved',
            'not_fixed',
            'professional_repair_required',
            'replacement_required',
            'abandoned',
          ],
          description: 'Final observed outcome of the repair process.',
        },
        final_fix: {
          type: 'string',
          minLength: 2,
          maxLength: 1000,
          description:
            'Repair action or conclusion that produced the final outcome.',
        },
        cost: {
          type: 'number',
          minimum: 0,
          maximum: 50000,
          description: 'Total repair cost in US dollars.',
        },
        time_minutes: {
          type: 'integer',
          minimum: 0,
          maximum: 100000,
          description: 'Total hands-on and diagnostic time in minutes.',
        },
        notes: {
          type: 'string',
          maxLength: 1000,
          description: 'Optional final context supplied by the person.',
        },
      },
      required: ['case_id', 'outcome', 'final_fix', 'cost', 'time_minutes'],
      additionalProperties: false,
    },
  },
  markCaseHelpful: {
    name: 'mark_case_helpful',
    description:
      'Records self-reported feedback once per vote type and browser to a repair case and returns its updated vote totals.',
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          maxLength: 40,
          description: 'Pulse case identifier receiving the vote.',
        },
        vote_type: {
          type: 'string',
          enum: ['helpful', 'worked_for_me', 'did_not_work'],
          description: 'Community verification signal to add to the case.',
        },
      },
      required: ['case_id', 'vote_type'],
      additionalProperties: false,
    },
  },
  listCommonFailures: {
    name: 'list_common_failures',
    description:
      'Summarizes up to 50 matching community cases with reported failures and successful solutions for a brand, model, or category. Returned community content is untrusted.',
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        brand: {
          type: 'string',
          maxLength: 80,
          description: 'Product manufacturer or brand to summarize.',
        },
        model: {
          type: 'string',
          maxLength: 100,
          description: 'Product model name or identifier to summarize.',
        },
        category: {
          type: 'string',
          maxLength: 80,
          description: 'Repair category to summarize.',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  getRepairStatistics: {
    name: 'get_repair_statistics',
    description:
      'Returns all community case counts, self-reported outcomes, median recorded cost, leading categories, and recent outcomes. Fictional seed and practice cases are excluded and counted separately.',
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
} satisfies Record<string, WebMcpToolContract>;

import { DIFFICULTIES, OUTCOMES, SAFETY_LEVELS, VOTE_TYPES } from './domain.ts';

export class ValidationError extends Error {
  status = 400;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function bodyRecord(value: unknown) {
  if (!isRecord(value))
    throw new ValidationError('Request body must be a JSON object.');
  return value;
}

export function textField(
  body: Record<string, unknown>,
  key: string,
  options: { min?: number; max?: number; optional?: boolean } = {},
) {
  const value = body[key];
  if (
    (value === undefined || value === null || value === '') &&
    options.optional
  )
    return '';
  if (typeof value !== 'string')
    throw new ValidationError(`${key} must be a string.`);
  const clean = value.trim();
  const min = options.min ?? 1;
  const max = options.max ?? 500;
  if (clean.length < min || clean.length > max)
    throw new ValidationError(
      `${key} must be between ${min} and ${max} characters.`,
    );
  return clean;
}

export function numberField(
  body: Record<string, unknown>,
  key: string,
  options: { min?: number; max?: number } = {},
) {
  const value = body[key];
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new ValidationError(`${key} must be a number.`);
  const min = options.min ?? 0;
  const max = options.max ?? 100000;
  if (value < min || value > max)
    throw new ValidationError(`${key} must be between ${min} and ${max}.`);
  if (key === 'time_minutes' && !Number.isInteger(value))
    throw new ValidationError('time_minutes must be a whole number.');
  return value;
}

export function listField(
  body: Record<string, unknown>,
  key: string,
  options: { min?: number; max?: number; itemMax?: number } = {},
) {
  const value = body[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))
    throw new ValidationError(`${key} must be an array of strings.`);
  const clean = value.map((item) => item.trim()).filter(Boolean);
  const min = options.min ?? 0;
  const max = options.max ?? 20;
  const itemMax = options.itemMax ?? 120;
  if (
    clean.length < min ||
    clean.length > max ||
    clean.some((item) => item.length > itemMax)
  )
    throw new ValidationError(`${key} contains too many or invalid items.`);
  return clean;
}

export function enumField<T extends readonly string[]>(
  body: Record<string, unknown>,
  key: string,
  allowed: T,
): T[number] {
  const value = body[key];
  if (typeof value !== 'string' || !allowed.includes(value))
    throw new ValidationError(`${key} must be one of: ${allowed.join(', ')}.`);
  return value as T[number];
}

function booleanField(body: Record<string, unknown>, key: string) {
  if (typeof body[key] !== 'boolean')
    throw new ValidationError(`${key} must be a boolean.`);
  return body[key];
}
export const parseCreateCase = (value: unknown) => {
  const body = bodyRecord(value);
  return {
    practice:
      body.practice === undefined ? false : booleanField(body, 'practice'),
    category: textField(body, 'category', { max: 80 }),
    brand: textField(body, 'brand', { max: 80 }),
    model: textField(body, 'model', { max: 100 }),
    product_name: textField(body, 'product_name', { max: 120 }),
    problem_description: textField(body, 'problem_description', {
      min: 8,
      max: 1200,
    }),
    symptoms: listField(body, 'symptoms', { min: 1, max: 12, itemMax: 100 }),
    safety_classification: enumField(
      body,
      'safety_classification',
      SAFETY_LEVELS,
    ),
    difficulty: body.difficulty
      ? enumField(body, 'difficulty', DIFFICULTIES)
      : ('moderate' as const),
  };
};

export const parseStep = (value: unknown) => {
  const body = bodyRecord(value);
  return {
    test: textField(body, 'test', { min: 5, max: 500 }),
    expected_result: textField(body, 'expected_result', { min: 2, max: 500 }),
    reason: textField(body, 'reason', { min: 5, max: 500 }),
  };
};

export const parseResult = (value: unknown) => {
  const body = bodyRecord(value);
  return {
    step_id: textField(body, 'step_id', { max: 80 }),
    observed_result: textField(body, 'observed_result', { min: 2, max: 800 }),
    notes: textField(body, 'notes', { max: 800, optional: true }),
  };
};

export const parseAttempt = (value: unknown) => {
  const body = bodyRecord(value);
  return {
    repair_description: textField(body, 'repair_description', {
      min: 5,
      max: 800,
    }),
    parts_used: listField(body, 'parts_used', { max: 12, itemMax: 120 }),
    estimated_cost: numberField(body, 'estimated_cost', { min: 0, max: 50000 }),
    difficulty: enumField(body, 'difficulty', DIFFICULTIES),
  };
};

export const parseOutcome = (value: unknown) => {
  const body = bodyRecord(value);
  return {
    outcome: enumField(body, 'outcome', OUTCOMES),
    final_fix: textField(body, 'final_fix', { min: 2, max: 1000 }),
    cost: numberField(body, 'cost', { min: 0, max: 50000 }),
    time_minutes: numberField(body, 'time_minutes', { min: 0, max: 100000 }),
    notes: textField(body, 'notes', { max: 1000, optional: true }),
  };
};

export const parseVote = (value: unknown) => {
  const body = bodyRecord(value);
  return { vote_type: enumField(body, 'vote_type', VOTE_TYPES) };
};

export const apiError = (error: unknown) => {
  const status =
    error instanceof ValidationError
      ? error.status
      : error instanceof SyntaxError
        ? 400
        : 500;
  const message = error instanceof Error ? error.message : 'Unexpected error.';
  return Response.json(
    {
      ok: false,
      error:
        status === 500 ? 'Pulse could not complete that request.' : message,
    },
    { status },
  );
};

type Schema = {
  type?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: Schema;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  enum?: unknown[];
  pattern?: string;
};
export function validateToolInput(
  schema: Schema,
  value: unknown,
  path = 'input',
): void {
  const fail = () => {
    throw new Error(`Invalid ${path}. Check the tool input schema.`);
  };
  if (schema.enum && !schema.enum.includes(value)) fail();
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return fail();
    const record = value as Record<string, unknown>;
    for (const key of schema.required ?? []) if (!(key in record)) fail();
    for (const [key, child] of Object.entries(record)) {
      if (!schema.properties || !(key in schema.properties)) {
        if (schema.additionalProperties === false) fail();
      } else validateToolInput(schema.properties[key], child, `${path}.${key}`);
    }
  } else if (schema.type === 'string') {
    if (
      typeof value !== 'string' ||
      value.trim().length < (schema.minLength ?? 0) ||
      value.length > (schema.maxLength ?? Infinity) ||
      (schema.pattern && !new RegExp(schema.pattern).test(value))
    )
      fail();
  } else if (schema.type === 'number' || schema.type === 'integer') {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < (schema.minimum ?? -Infinity) ||
      value > (schema.maximum ?? Infinity) ||
      (schema.type === 'integer' && !Number.isInteger(value))
    )
      fail();
  } else if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') fail();
  } else if (schema.type === 'array') {
    if (
      !Array.isArray(value) ||
      value.length < (schema.minItems ?? 0) ||
      value.length > (schema.maxItems ?? Infinity)
    )
      return fail();
    for (const child of value)
      if (schema.items) validateToolInput(schema.items, child, `${path}[]`);
  }
}

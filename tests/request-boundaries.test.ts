import test from 'node:test';
import assert from 'node:assert/strict';
import { mutationRateLimit } from '../lib/rate-limit.ts';
import {
  MAX_JSON_BODY_BYTES,
  parseCreateCase,
  readJsonBody,
  ValidationError,
} from '../lib/validation.ts';

const endpoint = 'https://pulse.example/api/repairs';

void test('JSON reader accepts ordinary requests and rejects oversized declared bodies', async () => {
  const valid = new Request(endpoint, {
    method: 'POST',
    body: JSON.stringify({ value: 'practice' }),
  });
  assert.deepEqual(await readJsonBody(valid), { value: 'practice' });

  const declaredOversize = new Request(endpoint, {
    method: 'POST',
    body: '{}',
    headers: { 'Content-Length': String(MAX_JSON_BODY_BYTES + 1) },
  });
  await assert.rejects(readJsonBody(declaredOversize), (error: unknown) => {
    assert.ok(error instanceof ValidationError);
    assert.equal(error.status, 413);
    return true;
  });

  const oversized = new Request(endpoint, {
    method: 'POST',
    body: JSON.stringify({ padding: 'x'.repeat(MAX_JSON_BODY_BYTES) }),
  });
  await assert.rejects(readJsonBody(oversized), (error: unknown) => {
    assert.ok(error instanceof ValidationError);
    assert.equal(error.status, 413);
    return true;
  });
});

void test('largest supported create fields fit within the JSON body cap', async () => {
  // JSON escaping can expand a single accepted character to six ASCII bytes.
  const character = '\u0000';
  const input = {
    category: character.repeat(80),
    brand: character.repeat(80),
    model: character.repeat(100),
    product_name: character.repeat(120),
    problem_description: character.repeat(1_200),
    symptoms: Array.from({ length: 12 }, () => character.repeat(100)),
    safety_classification: 'low_risk',
  };
  const body = JSON.stringify(input);
  assert.ok(new TextEncoder().encode(body).byteLength < MAX_JSON_BODY_BYTES);
  const parsed = parseCreateCase(
    await readJsonBody(new Request(endpoint, { method: 'POST', body })),
  );
  assert.equal(parsed.problem_description.length, 1_200);
  assert.equal(parsed.symptoms.length, 12);
});

void test('JSON reader counts streamed UTF-8 bytes despite an understated length', async () => {
  const bytes = new TextEncoder().encode(
    JSON.stringify({ padding: '\u{1F600}'.repeat(MAX_JSON_BODY_BYTES / 4) }),
  );
  assert.ok(bytes.byteLength < 64 * 1024);
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.subarray(0, 8_000));
      controller.enqueue(bytes.subarray(8_000));
      controller.close();
    },
  });
  const request = new Request(endpoint, {
    method: 'POST',
    body,
    duplex: 'half',
    headers: { 'Content-Length': '1' },
  } as RequestInit & { duplex: 'half' });
  await assert.rejects(readJsonBody(request), (error: unknown) => {
    assert.ok(error instanceof ValidationError);
    assert.equal(error.status, 413);
    return true;
  });
});

void test('JSON reader rejects invalid UTF-8 and malformed JSON', async () => {
  const invalidUtf8 = new Request(endpoint, {
    method: 'POST',
    body: new Uint8Array([0xff]),
  });
  await assert.rejects(readJsonBody(invalidUtf8), ValidationError);

  const malformed = new Request(endpoint, { method: 'POST', body: '{' });
  await assert.rejects(readJsonBody(malformed), SyntaxError);
});

void test('rate limiter ignores caller-controlled forwarding header', () => {
  const suffix = Math.random().toString(36).slice(2);
  const request = (forwardedFor: string, connectingIp?: string) =>
    new Request(endpoint, {
      headers: {
        'X-Forwarded-For': forwardedFor,
        ...(connectingIp ? { 'CF-Connecting-IP': connectingIp } : {}),
      },
    });
  const sharedIp = `test-${suffix}`;
  assert.equal(mutationRateLimit(request('one', sharedIp), 2), null);
  assert.equal(mutationRateLimit(request('two', sharedIp), 2), null);
  assert.equal(mutationRateLimit(request('three', sharedIp), 2)?.status, 429);

  // In local mode there is no trusted client IP, so forwarded values share
  // one conservative anonymous bucket. Use the current bucket without relying
  // on its exact count if another test has already populated it.
  const first = mutationRateLimit(request('local-one'), 1);
  const second = mutationRateLimit(request('local-two'), 1);
  assert.equal(second?.status, 429);
  assert.ok(first === null || first.status === 429);
});

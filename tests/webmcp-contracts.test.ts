import assert from 'node:assert/strict';
import test from 'node:test';
import { webMcpToolContracts } from '../lib/webmcp-contracts.ts';

void test('WebMCP contracts describe every input and keep metadata declarative', () => {
  const contracts = Object.values(webMcpToolContracts);
  assert.equal(contracts.length, 10);

  for (const contract of contracts) {
    assert.ok(contract.title.trim().length > 0);
    assert.doesNotMatch(
      contract.description,
      /\b(?:do not|must|never)\b/i,
      `${contract.name} metadata should describe behavior rather than instruct an agent`,
    );
    assert.ok(
      Array.isArray(contract.inputSchema.required),
      `${contract.name} should explicitly declare its required inputs`,
    );

    const properties = (contract.inputSchema.properties ?? {}) as Record<
      string,
      {
        description?: unknown;
        type?: unknown;
        items?: { description?: unknown };
      }
    >;
    for (const [propertyName, property] of Object.entries(properties)) {
      assert.equal(
        typeof property.description,
        'string',
        `${contract.name}.${propertyName} needs a description`,
      );
      assert.ok(
        String(property.description).trim().length > 0,
        `${contract.name}.${propertyName} needs a non-empty description`,
      );
      if (property.type === 'array') {
        assert.equal(
          typeof property.items?.description,
          'string',
          `${contract.name}.${propertyName} array items need a description`,
        );
      }
    }
  }
});

void test('physical-world mutation descriptions preserve the human evidence boundary', () => {
  assert.match(
    webMcpToolContracts.addDiagnosticResult.description,
    /reported by a person/i,
  );
  assert.match(
    webMcpToolContracts.recordRepairAttempt.description,
    /reported by a person/i,
  );
  assert.match(
    webMcpToolContracts.recordRepairOutcome.description,
    /observed or confirmed by a person/i,
  );
});

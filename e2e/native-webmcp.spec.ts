import { test, expect, type Page } from '@playwright/test';
import { webMcpToolContracts } from '../lib/webmcp-contracts';

type NativeTool = {
  name: string;
  title: string;
  inputSchema: string | Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  origin: string;
};
type NativeContext = {
  getTools(): Promise<NativeTool[]>;
  executeTool(
    tool: NativeTool,
    input: string | Record<string, unknown>,
  ): Promise<unknown>;
};
const names = Object.values(webMcpToolContracts)
  .map((tool) => tool.name)
  .sort();
const errors = new WeakMap<Page, string[]>();
const practiceInput = {
  category: 'Desk accessories',
  brand: 'Example',
  model: 'Native practice',
  product_name: 'Cable clip',
  problem_description: 'Fictional practice: clip does not hold the cable.',
  symptoms: ['loose clip'],
  safety_classification: 'low_risk',
  practice: true,
};
async function call(
  page: Page,
  name: string,
  input: Record<string, unknown> = {},
) {
  return page.evaluate(
    async ({ name, input }) => {
      const native = document.modelContext as unknown as NativeContext;
      const tool = (await native.getTools()).find((tool) => tool.name === name);
      if (!tool) throw new Error(`Native discovery did not return ${name}`);
      const major = Number(navigator.userAgent.match(/Chrome\/(\d+)/)?.[1]);
      try {
        const result = await native.executeTool(
          tool,
          major < 155 ? JSON.stringify(input) : input,
        );
        return typeof result === 'string' ? JSON.parse(result) : result;
      } catch (error) {
        return { nativeError: (error as Error).message };
      }
    },
    { name, input },
  );
}
async function toolNames(page: Page) {
  return page.evaluate(async () =>
    (await (document.modelContext as unknown as NativeContext).getTools())
      .map((tool) => tool.name)
      .sort(),
  );
}
async function ready(page: Page) {
  await expect.poll(() => toolNames(page)).toEqual(names);
}
test.beforeEach(async ({ page, browser }, testInfo) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on('pageerror', (error) => messages.push(error.message));
  await testInfo.attach('browser-version', {
    body: browser.version(),
    contentType: 'text/plain',
  });
  await page.goto('/');
  await ready(page);
  expect(
    await page.evaluate(() => document.modelContext?.registerTool.toString()),
  ).toContain('[native code]');
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test('native discovery exposes ten titled contracts and reads actual public evidence', async ({
  page,
}) => {
  const tools = await page.evaluate(async () =>
    (document.modelContext as unknown as NativeContext).getTools(),
  );
  for (const contract of Object.values(webMcpToolContracts)) {
    const actual = tools.find((tool) => tool.name === contract.name)!;
    expect(actual.title.length).toBeGreaterThan(0);
    expect(
      typeof actual.inputSchema === 'string'
        ? JSON.parse(actual.inputSchema)
        : actual.inputSchema,
    ).toEqual(contract.inputSchema);
    expect(actual.annotations).toMatchObject(contract.annotations);
    expect(actual.origin).toBe(new URL(page.url()).origin);
  }
  const search = await call(page, 'search_repairs', {
    source: 'examples',
    limit: 1,
  });
  expect(search.repairs).toHaveLength(1);
  const repair = await call(page, 'get_repair_case', {
    case_id: search.repairs[0].case_id,
  });
  expect(repair.case_id).toBe(search.repairs[0].case_id);
  expect(repair.can_edit).toBe(false);
  expect(await call(page, 'list_common_failures')).toMatchObject({
    sample_limit: 50,
  });
  const nativeStats = await call(page, 'get_repair_statistics');
  const httpStats = (await (await page.request.get('/api/statistics')).json())
    .statistics;
  expect(nativeStats).toEqual(httpStats);
  await page.goto('/webmcp');
  await ready(page);
  await expect(
    page.locator('.tool-row').getByText('Registered', { exact: true }),
  ).toHaveCount(10);
});

test('all ten native tools complete a visible durable journal without affecting community totals', async ({
  page,
}) => {
  test.skip(
    !!process.env.PULSE_WEBMCP_URL,
    'Mutating fixtures run against local D1 only.',
  );
  const before = await call(page, 'get_repair_statistics');
  expect(
    (await call(page, 'search_repairs', { source: 'examples', limit: 20 }))
      .repairs,
  ).toHaveLength(20);
  const created = await call(page, 'create_repair_case', practiceInput);
  expect(created.created).toBe(true);
  const id = created.case.case_id;
  await page.goto(created.page);
  await ready(page);
  await expect(
    page.getByRole('heading', { name: 'Continue this case', exact: true }),
  ).toBeVisible();
  const step = await call(page, 'add_diagnostic_step', {
    case_id: id,
    test: 'Inspect the external clip shape.',
    expected_result: 'Shape is intact.',
    reason: 'Check the visible shape first.',
  });
  expect(step.updated).toBe(true);
  await expect(page.locator('.timeline')).toContainText(
    'Inspect the external clip shape.',
  );
  expect(
    (
      await call(page, 'add_diagnostic_result', {
        case_id: id,
        step_id: step.diagnostic_step.id,
        observed_result: 'Fictional observation: shape is intact.',
        notes: 'Native practice only.',
      })
    ).updated,
  ).toBe(true);
  await expect(page.locator('.timeline')).toContainText(
    'Fictional observation: shape is intact.',
  );
  expect(
    (
      await call(page, 'record_repair_attempt', {
        case_id: id,
        repair_description: 'Fictional attempt: changed clip size.',
        parts_used: ['clip'],
        estimated_cost: 1,
        difficulty: 'easy',
      })
    ).updated,
  ).toBe(true);
  await expect(page.locator('.timeline')).toContainText(
    'Fictional attempt: changed clip size.',
  );
  expect(
    (
      await call(page, 'record_repair_outcome', {
        case_id: id,
        outcome: 'fixed',
        final_fix: 'Fictional outcome: clip fits.',
        cost: 1,
        time_minutes: 2,
        notes: 'Native practice only.',
      })
    ).updated,
  ).toBe(true);
  await expect(page.locator('.timeline')).toContainText(
    'Fictional outcome: clip fits.',
  );
  for (let i = 0; i < 2; i++)
    expect(
      (
        await call(page, 'mark_case_helpful', {
          case_id: id,
          vote_type: 'helpful',
        })
      ).votes.helpful,
    ).toBe(1);
  const full = await call(page, 'get_repair_case', { case_id: id });
  expect(full.can_edit).toBe(true);
  expect(full.diagnostic_steps[0].status).toBe('completed');
  expect(full.repair_attempts).toHaveLength(1);
  expect(full.outcome_record.notes).toBe('Native practice only.');
  expect(await call(page, 'list_common_failures')).toHaveProperty(
    'sample_limit',
    50,
  );
  const after = await call(page, 'get_repair_statistics');
  expect(after.total_repair_cases).toBe(before.total_repair_cases);
  expect(after.example_cases).toBe(before.example_cases + 1);
  await page.reload();
  await ready(page);
  await expect(page.locator('.timeline')).toContainText(
    'Native practice only.',
  );
  const exported = await (
    await page.request.get(`/api/repairs/${id}/export`)
  ).json();
  expect(exported.repair.demo_record).toBe(true);
  expect(exported.repair.outcome).toMatchObject({ cost: 1, time_minutes: 2 });
});

test('native validation, browser ownership and professional-case boundaries reject invalid writes', async ({
  page,
  browser,
}) => {
  test.skip(
    !!process.env.PULSE_WEBMCP_URL,
    'Mutating fixtures run against local D1 only.',
  );
  const before = await call(page, 'get_repair_statistics');
  const invalidInputs: [string, Record<string, unknown>][] = [
    ['search_repairs', { limit: 999 }],
    ['search_repairs', { source: 'invented' }],
    ['get_repair_case', { case_id: 'bad id' }],
    ['create_repair_case', {}],
    ['create_repair_case', { ...practiceInput, practice: 'true' }],
    ['create_repair_case', { ...practiceInput, symptoms: [] }],
    ['add_diagnostic_step', { case_id: 'MS-TEST' }],
    [
      'add_diagnostic_result',
      { case_id: 'MS-TEST', observed_result: 'Result' },
    ],
    ['record_repair_attempt', { case_id: 'MS-TEST', estimated_cost: -1 }],
    ['record_repair_outcome', { case_id: 'MS-TEST', outcome: 'unknown' }],
    ['mark_case_helpful', { case_id: 'MS-TEST', vote_type: 'unknown' }],
    ['list_common_failures', { limit: 100 }],
    ['get_repair_statistics', { extra: true }],
  ];
  for (const [name, input] of invalidInputs)
    expect((await call(page, name, input)).nativeError, name).toBeTruthy();
  expect(await call(page, 'get_repair_statistics')).toEqual(before);
  const created = await call(page, 'create_repair_case', practiceInput);
  const id = created.case.case_id;
  const other = await browser.newContext();
  const visitor = await other.newPage();
  await visitor.goto(new URL(`/repairs/${id}`, page.url()).href);
  await ready(visitor);
  expect(
    (await call(visitor, 'get_repair_case', { case_id: id })).can_edit,
  ).toBe(false);
  expect(
    (
      await call(visitor, 'record_repair_outcome', {
        case_id: id,
        outcome: 'fixed',
        final_fix: 'Visitor cannot replace this.',
        cost: 0,
        time_minutes: 0,
      })
    ).nativeError,
  ).toBeTruthy();
  expect(
    (await call(page, 'get_repair_case', { case_id: id })).outcome_record,
  ).toBeNull();
  await other.close();
  const professional = await call(page, 'create_repair_case', {
    ...practiceInput,
    safety_classification: 'professional_recommended',
  });
  const professionalId = professional.case.case_id;
  expect(
    (
      await call(page, 'add_diagnostic_step', {
        case_id: professionalId,
        test: 'Record service appointment.',
        expected_result: 'Service requested.',
        reason: 'Qualified service will assess the object.',
      })
    ).nativeError,
  ).toBeTruthy();
  expect(
    (
      await call(page, 'record_repair_outcome', {
        case_id: professionalId,
        outcome: 'professional_repair_required',
        final_fix: 'Qualified service requested.',
        cost: 0,
        time_minutes: 0,
      })
    ).updated,
  ).toBe(true);
  await page.goto(professional.page);
  await expect(
    page.getByText('Qualified service recommended', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('1. Propose a diagnostic check', { exact: true }),
  ).toHaveCount(0);
});

test('native registrations clean up, restore and survive actual back-forward caching', async ({
  page,
}, testInfo) => {
  await page.goto('/webmcp');
  await ready(page);
  await expect(
    page.locator('.tool-row').getByText('Registered', { exact: true }),
  ).toHaveCount(10);
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent('pagehide', { persisted: true }),
    ),
  );
  await expect.poll(() => toolNames(page)).toEqual([]);
  await expect(
    page.locator('.tool-row').getByText('Registered', { exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent('pageshow', { persisted: true }),
    ),
  );
  await ready(page);
  await expect(
    page.locator('.tool-row').getByText('Registered', { exact: true }),
  ).toHaveCount(10);
  expect(await call(page, 'get_repair_statistics')).toHaveProperty(
    'example_cases',
  );
  await page.evaluate(() => {
    window.addEventListener('pageshow', (event) => {
      (window as unknown as { pulseRestored: boolean }).pulseRestored =
        event.persisted;
    });
  });
  await page.goto('/llms.txt');
  await page.goBack({ waitUntil: 'commit' });
  await ready(page);
  const restored = await page.evaluate(
    () =>
      (window as unknown as { pulseRestored?: boolean }).pulseRestored === true,
  );
  await testInfo.attach('back-forward-cache', {
    body: JSON.stringify({ restored }),
    contentType: 'application/json',
  });
  if (!process.env.PULSE_WEBMCP_URL) expect(restored).toBe(true);
  expect(await call(page, 'get_repair_statistics')).toHaveProperty(
    'example_cases',
  );
  await page.reload();
  await ready(page);
});

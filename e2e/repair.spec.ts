import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const caseInput = {
  category: 'Desk accessories',
  brand: 'Example',
  model: 'Practice',
  product_name: 'Cable clip',
  problem_description: 'Fictional practice: clip does not hold the cable.',
  symptoms: ['loose clip'],
  safety_classification: 'low_risk',
  practice: true,
};
async function create(page: Page, extra = {}) {
  const response = await page.request.post('/api/repairs', {
    data: { ...caseInput, ...extra },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).repair as { id: string };
}
test('ordinary browser completes the full journal, reloads saved evidence and exports JSON', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/repair/new');
  for (const [label, value] of Object.entries({
    Category: 'Desk accessories',
    Brand: 'Example',
    Model: 'Practice',
    'Product name': 'Cable clip',
    'Problem description': caseInput.problem_description,
  }))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel('Symptoms').fill('loose clip');
  await page.getByLabel('This is a practice case').check();
  await page
    .getByRole('button', { name: 'Create repair case', exact: true })
    .click();
  await page.getByRole('link', { name: 'Open repair case' }).click();
  await expect(
    page.getByRole('heading', { name: 'Continue this case', exact: true }),
  ).toBeVisible();
  await page
    .getByText('1. Propose a diagnostic check', { exact: true })
    .click();
  await page
    .getByLabel('Diagnostic check', { exact: true })
    .fill('Inspect the external clip shape.');
  await page
    .getByLabel('Expected result', { exact: true })
    .fill('The clip matches the cable diameter.');
  await page
    .getByLabel('Reason for this check')
    .fill('Compare the fit without altering the clip.');
  await page.getByRole('button', { name: 'Save diagnostic check' }).click();
  await expect(page.locator('.timeline')).toContainText(
    'Inspect the external clip shape.',
  );
  await page.getByText('2. Record an observation', { exact: true }).click();
  await page
    .getByLabel('Observed result', { exact: true })
    .fill('Fictional example: the clip is too wide.');
  await page.getByLabel('Observation notes').fill('Practice data only.');
  await page.getByRole('button', { name: 'Save observation' }).click();
  await expect(page.locator('.timeline')).toContainText('the clip is too wide');
  await page.getByText('3. Record a repair attempt', { exact: true }).click();
  await page
    .getByLabel('What was attempted')
    .fill('Fictional example: tried a smaller clip.');
  await page.getByLabel('Parts used').fill('small clip');
  await page.getByLabel('Estimated cost (USD)', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Save repair attempt' }).click();
  await expect(page.locator('.timeline')).toContainText('tried a smaller clip');
  await page
    .getByText('4. Record or correct the outcome', { exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Outcome', exact: true })
    .selectOption('fixed');
  await page
    .getByLabel('Final fix or conclusion')
    .fill('Fictional example: smaller clip fit correctly.');
  await page.getByLabel('Total cost (USD)', { exact: true }).fill('2');
  await page.getByLabel('Time spent (whole minutes)').fill('5');
  await page
    .getByLabel('Outcome notes')
    .fill('This is not a real repair report.');
  await page.getByRole('button', { name: 'Save outcome' }).click();
  await expect(page.locator('.timeline')).toContainText(
    'smaller clip fit correctly',
  );
  await page.reload();
  await expect(page.locator('.timeline')).toContainText(
    'This is not a real repair report.',
  );
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Export case JSON' }).click(),
  ]);
  expect(download[0].suggestedFilename()).toMatch(/^pulse-MS-.*\.json$/);
  const result = await page.request.get(
    `${new URL(page.url()).pathname.replace('/repairs/', '/api/repairs/')}/export`,
  );
  const exported = await result.json();
  expect(exported.repair.outcome.cost).toBe(2);
  expect(exported.repair.demo_record).toBe(true);
  expect(exported.repair.diagnostic_steps[0].status).toBe('completed');
  expect(errors).toEqual([]);
  await mkdir('../../outputs', { recursive: true });
  await page.screenshot({
    path: '../../outputs/pulse-desktop.png',
    fullPage: true,
  });
});

test('failed outcome writes preserve the draft and correcting an outcome preserves earlier evidence', async ({
  page,
}) => {
  const repair = await create(page);
  const step = await page.request.post(`/api/repairs/${repair.id}/steps`, {
    data: {
      test: 'Fictional fit check.',
      expected_result: 'Clip fits.',
      reason: 'Practice only.',
    },
  });
  expect(step.status()).toBe(201);
  expect(
    (
      await page.request.post(`/api/repairs/${repair.id}/attempts`, {
        data: {
          repair_description: 'Fictional clip-size attempt.',
          parts_used: ['clip'],
          estimated_cost: 1,
          difficulty: 'easy',
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto(`/repairs/${repair.id}`);
  await page
    .getByText('4. Record or correct the outcome', { exact: true })
    .click();
  const conclusion = page.getByLabel('Final fix or conclusion');
  await conclusion.fill('Fictional first outcome.');
  await page.getByLabel('Total cost (USD)', { exact: true }).fill('1');
  await page.getByLabel('Time spent (whole minutes)').fill('2');
  // Forward the request to actual D1 handlers with an invalid cost; do not mock a response.
  await page.route(`**/api/repairs/${repair.id}/outcome`, async (route) => {
    const input = route.request().postDataJSON();
    await route.continue({ postData: JSON.stringify({ ...input, cost: -1 }) });
  });
  const rejected = page.waitForResponse((response) =>
    response.url().endsWith(`/api/repairs/${repair.id}/outcome`),
  );
  await page.getByRole('button', { name: 'Save outcome' }).click();
  expect((await rejected).status()).toBe(400);
  await expect(conclusion).toHaveValue('Fictional first outcome.');
  expect(
    (await (await page.request.get(`/api/repairs/${repair.id}`)).json()).repair
      .outcome,
  ).toBeNull();
  await page.unroute(`**/api/repairs/${repair.id}/outcome`);
  await page.getByRole('button', { name: 'Save outcome' }).click();
  await expect(page.locator('.timeline')).toContainText(
    'Fictional first outcome.',
  );
  await conclusion.fill('Fictional corrected outcome.');
  await page.getByLabel('Total cost (USD)', { exact: true }).fill('3');
  await page.getByLabel('Time spent (whole minutes)').fill('4');
  await page.getByRole('button', { name: 'Save outcome' }).click();
  await expect(page.locator('.timeline')).toContainText(
    'Fictional corrected outcome.',
  );
  await page.reload();
  const saved = (
    await (await page.request.get(`/api/repairs/${repair.id}`)).json()
  ).repair;
  expect(saved.outcome.final_fix).toBe('Fictional corrected outcome.');
  expect(saved.outcome.cost).toBe(3);
  expect(saved.diagnostic_steps).toHaveLength(1);
  expect(saved.repair_attempts).toHaveLength(1);
});

test('another browser can read but cannot change an owned case; repeat feedback counts once', async ({
  page,
  browser,
}) => {
  const repair = await create(page);
  const other = await browser.newContext();
  const visitor = await other.newPage();
  await visitor.goto(`/repairs/${repair.id}`);
  await expect(
    visitor.getByText('Read-only in this browser.', { exact: false }),
  ).toBeVisible();
  const denied = await visitor.request.post(
    `/api/repairs/${repair.id}/outcome`,
    {
      data: {
        outcome: 'fixed',
        final_fix: 'A different visitor report',
        cost: 0,
        time_minutes: 0,
      },
    },
  );
  expect(denied.status()).toBe(403);
  for (let i = 0; i < 2; i++)
    expect(
      (
        await visitor.request.post(`/api/repairs/${repair.id}/votes`, {
          data: { vote_type: 'helpful' },
        })
      ).status(),
    ).toBe(200);
  const saved = await (
    await page.request.get(`/api/repairs/${repair.id}`)
  ).json();
  expect(saved.repair.votes.helpful).toBe(1);
  expect(saved.repair.outcome).toBeNull();
  expect(saved.can_edit).toBe(true);
  await other.close();
});

test('professional cases stay readable, reject diagnostic proposals and accept reported outcome', async ({
  page,
}) => {
  const repair = await create(page, {
    safety_classification: 'professional_recommended',
  });
  const result = await page.request.post(`/api/repairs/${repair.id}/steps`, {
    data: {
      test: 'Record a service appointment.',
      expected_result: 'Appointment recorded.',
      reason: 'A professional will assess the object.',
    },
  });
  expect(result.status()).toBe(403);
  expect(
    (
      await page.request.post(`/api/repairs/${repair.id}/outcome`, {
        data: {
          outcome: 'professional_repair_required',
          final_fix: 'Qualified service requested.',
          cost: 0,
          time_minutes: 0,
        },
      })
    ).status(),
  ).toBe(200);
  await page.goto(`/repairs/${repair.id}`);
  await expect(
    page.getByText('Qualified service recommended', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('1. Propose a diagnostic check', { exact: true }),
  ).toHaveCount(0);
});

test('statistics exclude practice and example data, search never substitutes examples on failure', async ({
  page,
}) => {
  const before = (await (await page.request.get('/api/statistics')).json())
    .statistics;
  await create(page);
  const after = (await (await page.request.get('/api/statistics')).json())
    .statistics;
  expect(after.total_repair_cases).toBe(before.total_repair_cases);
  expect(after.example_cases).toBe(before.example_cases + 1);
  await page.goto('/repairs?source=examples');
  await expect(page.locator('.repair-card').first()).toBeVisible();
  await page.getByLabel('Record source').selectOption('community');
  await expect(
    page.locator('.repair-card').filter({ hasText: 'EXAMPLE / PRACTICE' }),
  ).toHaveCount(0);
  await page.route('**/api/repairs?**', (route) =>
    route.fulfill({ status: 503, json: { error: 'Unavailable' } }),
  );
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(
    page.getByText('Search is unavailable.', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('.repair-card')).toHaveCount(0);
});

test('ten tool adapters return parseable complete JSON and update the visible case', async ({
  page,
}) => {
  // Test-only registry capture; native browser registration is verified separately after publication.
  await page.addInitScript(() => {
    const registry = new Map<string, WebMcpTool>();
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        registerTool: async (
          tool: WebMcpTool,
          options?: { signal?: AbortSignal },
        ) => {
          registry.set(tool.name, tool);
          options?.signal?.addEventListener('abort', () =>
            registry.delete(tool.name),
          );
        },
      },
    });
    Object.defineProperty(window, 'pulseTestTools', { value: registry });
  });
  await page.goto('/');
  await expect(page.getByText('10 WebMCP tools registered')).toBeVisible();
  async function call(name: string, input: Record<string, unknown>) {
    return page.evaluate(
      async ({ name, input }) => {
        const registry = (
          window as unknown as { pulseTestTools: Map<string, WebMcpTool> }
        ).pulseTestTools;
        return JSON.parse(String(await registry.get(name)!.execute(input)));
      },
      { name, input },
    );
  }
  const search = await call('search_repairs', {
    source: 'examples',
    limit: 20,
  });
  expect(search.repairs).toHaveLength(20);
  const created = await call('create_repair_case', caseInput);
  const id = created.case.case_id;
  await page.goto(`/repairs/${id}`);
  await expect(page.getByText('10 WebMCP tools registered')).toBeVisible();
  const step = await call('add_diagnostic_step', {
    case_id: id,
    test: 'Inspect the external clip shape.',
    expected_result: 'Shape is intact.',
    reason: 'Check the visible shape first.',
  });
  await call('add_diagnostic_result', {
    case_id: id,
    step_id: step.diagnostic_step.id,
    observed_result: 'Fictional observation: shape is intact.',
    notes: 'Practice only.',
  });
  await call('record_repair_attempt', {
    case_id: id,
    repair_description: 'Fictional attempt: changed clip size.',
    parts_used: ['clip'],
    estimated_cost: 1,
    difficulty: 'easy',
  });
  await call('record_repair_outcome', {
    case_id: id,
    outcome: 'fixed',
    final_fix: 'Fictional outcome: clip fits.',
    cost: 1,
    time_minutes: 2,
    notes: 'Practice only.',
  });
  await expect(page.locator('.timeline')).toContainText(
    'Fictional outcome: clip fits.',
  );
  await call('mark_case_helpful', { case_id: id, vote_type: 'helpful' });
  const full = await call('get_repair_case', { case_id: id });
  expect(full.outcome_record.notes).toBe('Practice only.');
  expect(full.can_edit).toBe(true);
  expect(await call('list_common_failures', {})).toHaveProperty(
    'sample_limit',
    50,
  );
  expect(await call('get_repair_statistics', {})).toHaveProperty(
    'example_cases',
  );
  const rejected = await page.evaluate(async () => {
    try {
      await (
        window as unknown as { pulseTestTools: Map<string, WebMcpTool> }
      ).pulseTestTools
        .get('search_repairs')!
        .execute({ limit: 999 });
      return false;
    } catch {
      return true;
    }
  });
  expect(rejected).toBe(true);
});

test('mobile navigation and public pages render without overflow or console errors', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByLabel('Reported community statistics'),
  ).not.toContainText('—');
  await page.getByLabel('Open navigation').click();
  await page
    .locator('.mobile-menu')
    .getByRole('link', { name: 'Explore Repairs' })
    .click();
  await page.getByLabel('Record source').selectOption('examples');
  await expect(page.locator('.repair-card').first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await mkdir('../../outputs', { recursive: true });
  await page.screenshot({
    path: '../../outputs/pulse-mobile.png',
    fullPage: false,
  });
  for (const url of ['/dashboard', '/webmcp', '/about']) {
    await page.goto(url);
    if (url === '/webmcp') {
      await expect(
        page.getByText('WebMCP not detected', { exact: true }),
      ).toBeVisible();
      await expect(
        page.locator('.tool-row').getByText('Unavailable', { exact: true }),
      ).toHaveCount(10);
      await expect(
        page.locator('.tool-row').getByText('Registered', { exact: true }),
      ).toHaveCount(0);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

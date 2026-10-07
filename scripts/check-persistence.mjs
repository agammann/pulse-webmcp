import { chromium, expect } from '@playwright/test';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

// Uses only a fictional local case and retains its browser cookie in memory.
// Run after pnpm build; a second build must preserve data and edit permission.
const source = resolve(import.meta.dirname, '..');
const port = Number(process.env.PULSE_PERSISTENCE_PORT ?? 3019);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('PULSE_PERSISTENCE_PORT must be a port from 1024 to 65535.');
const url = `http://localhost:${port}`;
let server, browser;
const run = (command) =>
  process.platform === 'win32'
    ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', command], {
        cwd: source,
        windowsHide: true,
        stdio: 'inherit',
      })
    : spawn('pnpm', command.split(' ').slice(1), {
        cwd: source,
        stdio: 'inherit',
        detached: true,
      });
async function start() {
  try {
    await fetch(url, { signal: AbortSignal.timeout(500) });
    throw new Error(
      `Port ${port} is already occupied; use a separate test port.`,
    );
  } catch (error) {
    if (error.message.includes('already occupied')) throw error;
  }
  server = run(`pnpm start --port ${port}`);
  for (let i = 0; i < 150; i++) {
    if (server.exitCode !== null)
      throw new Error('Local Worker exited before readiness.');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (response.ok) return;
    } catch {}
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error('Local Worker did not become ready.');
}
async function stop() {
  if (!server || server.exitCode !== null) {
    server = undefined;
    return;
  }
  const child = server;
  let timeout;
  const closed = new Promise((done) => child.once('close', done));
  if (process.platform === 'win32')
    execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    });
  else process.kill(-child.pid, 'SIGTERM');
  try {
    await Promise.race([
      closed,
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('Local Worker did not stop.')),
          10000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
    server = undefined;
  }
}
try {
  await start();
  browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: url });
  const created = await context.request.post('/api/repairs', {
    data: {
      category: 'Desk accessories',
      brand: 'Example',
      model: 'Persistence practice',
      product_name: 'Cable clip',
      problem_description: 'Fictional rebuild-persistence practice.',
      symptoms: ['loose clip'],
      safety_classification: 'low_risk',
      practice: true,
    },
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).repair.id;
  const before = await (await context.request.get(`/api/repairs/${id}`)).json();
  expect(before.can_edit).toBe(true);
  await stop();
  const command =
    process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'pnpm';
  const args =
    process.platform === 'win32' ? ['/d', '/s', '/c', 'pnpm build'] : ['build'];
  const rebuild = spawnSync(command, args, {
    cwd: source,
    windowsHide: true,
    stdio: 'inherit',
  });
  if (rebuild.status !== 0) throw new Error('Rebuild failed.');
  await start();
  const response = await context.request.get(`/api/repairs/${id}`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual(before);
  await context.close();
  console.log(
    JSON.stringify({
      status: 'passed',
      rebuilt: true,
      sameCookieCaseAndEditPermission: true,
      caseId: id,
    }),
  );
} finally {
  if (browser) await browser.close();
  await stop();
}

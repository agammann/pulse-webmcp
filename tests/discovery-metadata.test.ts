import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import robots from '../app/robots.ts';
import sitemap from '../app/sitemap.ts';
import nextConfig, { securityHeaders } from '../next.config.ts';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

void test('crawler discovery points at the public Pulse application', async () => {
  const robotsPolicy = robots();
  assert.equal(
    robotsPolicy.sitemap,
    'https://pulse.alx21.chatgpt.site/sitemap.xml',
  );

  const urls = sitemap().map((entry) => entry.url);
  assert.ok(urls.includes('https://pulse.alx21.chatgpt.site'));
  assert.ok(urls.includes('https://pulse.alx21.chatgpt.site/webmcp'));

  const llmsText = await readFile(`${projectRoot}public/llms.txt`, 'utf8');
  assert.match(llmsText, /^# Pulse/m);
  assert.match(llmsText, /document\.modelContext/);
  assert.match(llmsText, /untrusted content/i);
});

void test('every response receives the release security baseline', async () => {
  const values = new Map(securityHeaders.map(({ key, value }) => [key, value]));
  assert.match(
    values.get('Content-Security-Policy') ?? '',
    /frame-ancestors 'none'/,
  );
  assert.match(
    values.get('Content-Security-Policy') ?? '',
    /object-src 'none'/,
  );
  assert.equal(values.get('Strict-Transport-Security'), 'max-age=31536000');
  assert.equal(values.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(
    values.get('Referrer-Policy'),
    'strict-origin-when-cross-origin',
  );

  const configuredRoutes = await nextConfig.headers?.();
  assert.deepEqual(
    configuredRoutes?.map((route) => route.source),
    ['/', '/:path*'],
  );
});

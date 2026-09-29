const windows = new Map<string, { count: number; resetAt: number }>();

const MAX_TRACKED_CLIENTS = 10_000;

function removeExpiredWindows(now: number) {
  if (windows.size < MAX_TRACKED_CLIENTS) return;

  for (const [key, value] of windows) {
    if (value.resetAt <= now) windows.delete(key);
  }

  if (windows.size >= MAX_TRACKED_CLIENTS) {
    const oldestKey = windows.keys().next().value;
    if (oldestKey) windows.delete(oldestKey);
  }
}

export function mutationRateLimit(
  request: Request,
  limit = 30,
  windowMs = 60_000,
) {
  const forwarded =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    'anonymous';
  const key = forwarded.split(',')[0].trim();
  const now = Date.now();
  removeExpiredWindows(now);
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );
    return Response.json(
      { ok: false, error: 'Too many repair updates. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    );
  }
  current.count += 1;
  return null;
}

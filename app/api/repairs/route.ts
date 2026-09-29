import { mutationRequest } from '@/lib/access';
import { readSession } from '@/lib/session';
import { createRepairCase, searchRepairs } from '@/lib/database';
import { mutationRateLimit } from '@/lib/rate-limit';
import { apiError, parseCreateCase, ValidationError } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams.entries());
    if (
      filters.source &&
      !['community', 'examples', 'all'].includes(filters.source)
    )
      throw new ValidationError('Invalid record source.');
    if (
      filters.limit &&
      (!Number.isInteger(Number(filters.limit)) ||
        Number(filters.limit) < 1 ||
        Number(filters.limit) > 50)
    )
      throw new ValidationError('limit must be a whole number from 1 to 50.');
    if (Object.values(filters).some((value) => value.length > 300))
      throw new ValidationError(
        'Search fields must be at most 300 characters.',
      );
    const repairs = await searchRepairs(filters);
    return Response.json({ ok: true, count: repairs.length, repairs });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const limited = mutationRateLimit(request);
  if (limited) return limited;
  try {
    mutationRequest(request);
    const input = parseCreateCase(await request.json());
    const session = (await readSession(request, true))!;
    const repair = await createRepairCase(input, session.id);
    return Response.json(
      { ok: true, repair },
      {
        status: 201,
        headers: { 'Set-Cookie': session.cookie, 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    return apiError(error);
  }
}

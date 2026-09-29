import { mutationRequest } from '@/lib/access';
import { readSession } from '@/lib/session';
import { markHelpful } from '@/lib/database';
import { mutationRateLimit } from '@/lib/rate-limit';
import { apiError, parseVote } from '@/lib/validation';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = mutationRateLimit(request);
  if (limited) return limited;
  try {
    mutationRequest(request);
    const { id } = await context.params;
    const session = (await readSession(request, true))!;
    const repair = await markHelpful(
      id,
      parseVote(await request.json()).vote_type,
      session.id,
    );
    if (!repair)
      return Response.json(
        { ok: false, error: 'Repair case not found.' },
        { status: 404 },
      );
    return Response.json(
      { ok: true, repair },
      {
        headers: { 'Set-Cookie': session.cookie, 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    return apiError(error);
  }
}

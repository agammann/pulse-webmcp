import { requireEditor } from '@/lib/access';
import { recordRepairOutcome } from '@/lib/database';
import { mutationRateLimit } from '@/lib/rate-limit';
import { apiError, parseOutcome } from '@/lib/validation';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = mutationRateLimit(request);
  if (limited) return limited;
  try {
    const input = parseOutcome(await request.json());
    const { id } = await context.params;
    const denied = await requireEditor(request, id);
    if (denied) return denied;
    const repair = await recordRepairOutcome(id, input);
    if (!repair)
      return Response.json(
        { ok: false, error: 'Repair case not found.' },
        { status: 404 },
      );
    return Response.json({ ok: true, repair });
  } catch (error) {
    return apiError(error);
  }
}

import { requireEditor } from '@/lib/access';
import { addDiagnosticStep, getRepairCase } from '@/lib/database';
import { mutationRateLimit } from '@/lib/rate-limit';
import { apiError, parseStep, readJsonBody } from '@/lib/validation';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = mutationRateLimit(request);
  if (limited) return limited;
  try {
    const { id } = await context.params;
    const denied = await requireEditor(request, id);
    if (denied) return denied;
    const input = parseStep(await readJsonBody(request));
    const existing = await getRepairCase(id);
    if (existing?.safety_classification === 'professional_recommended')
      return Response.json(
        {
          ok: false,
          error:
            'This case is classified as professional recommended. Pulse preserves its history but does not add procedural diagnostic instructions.',
        },
        { status: 403 },
      );
    const repair = await addDiagnosticStep(id, input);
    if (!repair)
      return Response.json(
        { ok: false, error: 'Repair case not found.' },
        { status: 404 },
      );
    return Response.json({ ok: true, repair }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

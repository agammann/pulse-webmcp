import { getRepairCase, canEdit } from '@/lib/database';
import { readSession } from '@/lib/session';
import { apiError } from '@/lib/validation';
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const repair = await getRepairCase(id);
    if (!repair)
      return Response.json(
        { ok: false, error: 'Repair case not found.' },
        { status: 404 },
      );
    const session = await readSession(request, false);
    return Response.json(
      {
        ok: true,
        repair,
        can_edit: Boolean(session && (await canEdit(id, session.id))),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}

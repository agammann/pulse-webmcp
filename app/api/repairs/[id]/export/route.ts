import { getRepairCase } from '@/lib/database';
import { apiError } from '@/lib/validation';
export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const repair = await getRepairCase(id);
    if (!repair)
      return Response.json(
        { ok: false, error: 'Case not found.' },
        { status: 404 },
      );
    return new Response(
      JSON.stringify(
        {
          format: 'pulse-case-v1',
          exported_at: new Date().toISOString(),
          repair,
        },
        null,
        2,
      ),
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="pulse-${repair.id}.json"`,
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    return apiError(error);
  }
}

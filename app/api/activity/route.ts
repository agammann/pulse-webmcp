import { recentActivity } from '@/lib/database';
import { apiError } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    return Response.json({
      ok: true,
      activity: await recentActivity(
        Number(new URL(request.url).searchParams.get('limit') ?? 12),
      ),
    });
  } catch (error) {
    return apiError(error);
  }
}

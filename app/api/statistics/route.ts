import { statistics } from '@/lib/database';
import { apiError } from '@/lib/validation';

export async function GET() {
  try {
    return Response.json({ ok: true, statistics: await statistics() });
  } catch (error) {
    return apiError(error);
  }
}

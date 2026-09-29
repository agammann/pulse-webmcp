import { canEdit } from './database';
import { readSession } from './session';
import { ValidationError } from './validation';

export function mutationRequest(request: Request) {
  const origin = request.headers.get('origin');
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    throw new ValidationError(
      'Use Pulse in its own browser tab to save changes.',
    );
  }
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    throw new ValidationError('Send a JSON request.');
}
export async function requireEditor(request: Request, id: string) {
  mutationRequest(request);
  const session = await readSession(request, false);
  if (!session || !(await canEdit(id, session.id))) {
    return Response.json(
      {
        ok: false,
        error:
          'Only the browser that created this case can edit it. Older cases and examples remain readable.',
      },
      { status: 403 },
    );
  }
  return null;
}

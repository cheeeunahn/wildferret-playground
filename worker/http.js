// Small helpers shared by the API handlers.

const MAX_BODY_BYTES = 1024 * 1024;

// Thrown anywhere in a handler; becomes a JSON error response. The message
// is shown to the user, so it is written for them.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(body, { status = 200, cookie } = {}) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  if (cookie) headers.append('set-cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

export async function readJson(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw new HttpError(415, '요청 형식이 올바르지 않아요.');
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, '요청이 너무 커요.');
  try {
    const body = JSON.parse(text);
    if (body && typeof body === 'object' && !Array.isArray(body)) return body;
  } catch {
    // Falls through to the error below.
  }
  throw new HttpError(400, '요청 형식이 올바르지 않아요.');
}

// Browsers send Origin on every cross-site write. With the SameSite cookie
// and the JSON content type this keeps other sites from writing to a diary.
export function assertSameOrigin(request, url) {
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) throw new HttpError(403, '허용되지 않은 요청이에요.');
}

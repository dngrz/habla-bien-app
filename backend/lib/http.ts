const DEFAULT_ORIGINS = ['http://localhost:8081', 'http://127.0.0.1:8081'];

function allowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS;
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Devuelve las cabeceras CORS para el origen de la petición si está permitido.
 * En móvil nativo el navegador no aplica CORS, pero la app web de Expo sí.
 */
export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && allowedOrigins().includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export function preflight(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function jsonResponse(
  request: Request,
  data: unknown,
  init: { status?: number } = {},
): Response {
  return Response.json(data, {
    status: init.status ?? 200,
    headers: corsHeaders(request),
  });
}

export function errorResponse(
  request: Request,
  message: string,
  status = 400,
): Response {
  return jsonResponse(request, { error: message }, { status });
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

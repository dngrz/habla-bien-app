import { jsonResponse, preflight } from '@/lib/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request): Promise<Response> {
  return preflight(request);
}

export async function GET(request: Request): Promise<Response> {
  return jsonResponse(request, {
    status: 'ok',
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
  });
}

import { TOPICS, getRandomTopic } from '@/lib/topics';
import { jsonResponse, preflight } from '@/lib/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request): Promise<Response> {
  return preflight(request);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.searchParams.get('random') === 'true') {
    const topic = getRandomTopic(url.searchParams.get('exclude') ?? undefined);
    return jsonResponse(request, { topic });
  }
  return jsonResponse(request, { topics: TOPICS });
}

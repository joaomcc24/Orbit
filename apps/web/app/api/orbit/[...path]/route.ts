import type { NextRequest } from 'next/server';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const requestHeaderNames = ['accept', 'authorization', 'content-type'] as const;
const responseHeaderNames = ['cache-control', 'content-type'] as const;

function getApiBaseUrl(): URL {
  const rawUrl = process.env.ORBIT_API_URL ?? 'http://localhost:3001/api';

  try {
    return new URL(`${rawUrl.replace(/\/$/, '')}/`);
  } catch {
    throw new Error('ORBIT_API_URL must be a valid absolute URL');
  }
}

async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  let apiBaseUrl: URL;

  try {
    apiBaseUrl = getApiBaseUrl();
  } catch {
    return Response.json({ message: 'Orbit API proxy is not configured correctly.' }, { status: 500 });
  }

  const targetUrl = new URL(path.map(encodeURIComponent).join('/'), apiBaseUrl);
  targetUrl.search = request.nextUrl.search;
  const headers = new Headers();

  for (const name of requestHeaderNames) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return Response.json({ message: 'Orbit could not reach the API.' }, { status: 502 });
  }

  const responseHeaders = new Headers();

  for (const name of responseHeaderNames) {
    const value = upstreamResponse.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export const dynamic = 'force-dynamic';
export { proxy as DELETE, proxy as GET, proxy as PATCH, proxy as POST, proxy as PUT };

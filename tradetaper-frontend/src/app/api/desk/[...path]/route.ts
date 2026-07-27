import { NextRequest, NextResponse } from 'next/server';

/**
 * Same-origin proxy for the TaperAI Desk.
 *
 * The Desk runs as its own Cloud Run service and accepts only
 * `Authorization: Bearer <jwt>`, while the rest of TradeTaper authenticates
 * with the httpOnly `auth_token` cookie. The browser therefore had no token to
 * send and every Desk call 401'd.
 *
 * That cookie is scoped to .tradetaper.com, so it reaches this route. We read
 * it server-side and forward it as a bearer token. The JWT is never exposed to
 * client-side JavaScript, which keeps the Desk on the same security footing as
 * the rest of the app.
 */
const DESK_API_URL = (
  process.env.NEXT_PUBLIC_TAPERAI_API_URL ||
  'https://taperai-desk-326520250422.us-central1.run.app/api/v1'
).replace(/\/+$/, '');

export const dynamic = 'force-dynamic';

async function proxy(req: NextRequest, path: string[]) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json(
      { message: 'Not authenticated' },
      { status: 401 },
    );
  }

  const target = `${DESK_API_URL}/taper-ai/desk/${path.join('/')}${req.nextUrl.search}`;
  const body =
    req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : await req.text();

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
      cache: 'no-store',
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type':
          upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'The Desk service is unreachable. Please try again.' },
      { status: 502 },
    );
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, (await ctx.params).path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, (await ctx.params).path);
}

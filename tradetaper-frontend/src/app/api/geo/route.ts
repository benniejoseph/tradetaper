import { NextRequest, NextResponse } from 'next/server';

// Edge runtime so Vercel injects real IP geo headers
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Vercel injects x-vercel-ip-country on all plans (including Hobby)
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??   // Cloudflare fallback
    'US';                                     // default to US

  return NextResponse.json(
    { country },
    {
      headers: {
        // Cache per-browser for 1 hour; country doesn't change mid-session
        'Cache-Control': 'private, max-age=3600',
      },
    },
  );
}

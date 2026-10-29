import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = new URL(request.url);
  if (url.hostname !== 'www.pcieum.com') return NextResponse.next();

  // Keep the page and filters while consolidating the public hostname.
  url.protocol = 'https:';
  url.hostname = 'pcieum.com';
  url.port = '';
  return NextResponse.redirect(url, 308);
}

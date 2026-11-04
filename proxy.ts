import { NextResponse, type NextRequest } from 'next/server';
import { canonicalRedirectUrl } from './lib/http-policy';

export function proxy(request: NextRequest) {
  const destination = canonicalRedirectUrl(request);
  return destination ? NextResponse.redirect(destination, 308) : NextResponse.next();
}

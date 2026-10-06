import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { remoteLogout } from '@/lib/remote';

export async function POST() {
  const token = getToken();
  if (token) await remoteLogout(token); // best effort: cookies are cleared either way
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', '', { path: '/', maxAge: 0 });
  res.cookies.set('user', '', { path: '/', maxAge: 0 });
  return res;
}

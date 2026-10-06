import { NextResponse } from 'next/server';
import { remoteLogin, payload, one, toEmployee } from '@/lib/remote';

export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  const mail = String(email || '').trim().toLowerCase();

  const r = await remoteLogin(mail, password || '');
  if (!r.ok) {
    const status = r.status >= 400 && r.status < 500 ? r.status : 502;
    return NextResponse.json({ error: r.data.message || 'Email or password is incorrect.' }, { status });
  }

  const d = payload(r.data);
  const token = String(d.token || '');
  if (!token) return NextResponse.json({ error: 'Login server sent an unexpected reply.' }, { status: 502 });

  const user = toEmployee(one(r.data, 'user'));
  if (!user.email) user.email = mail;
  if (!user.name) user.name = mail.split('@')[0];
  if (user.status !== 'active') {
    return NextResponse.json({ error: 'This account is inactive. Ask your admin to activate it.' }, { status: 403 });
  }

  // expires_at is "YYYY-MM-DD HH:mm:ss" in UTC
  const expiry = new Date(String(d.expires_at || '').replace(' ', 'T') + 'Z');
  const maxAge = expiry > new Date() ? Math.floor((expiry - Date.now()) / 1000) : 7 * 24 * 60 * 60;

  const https = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
  const opts = { httpOnly: true, sameSite: 'lax', secure: https, path: '/', maxAge };
  const { taskCount, ...profile } = user;
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set('session', token, opts);
  res.cookies.set('user', JSON.stringify(profile), opts);
  return res;
}

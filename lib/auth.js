import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { remote } from './remote';

// "session" holds the API token, "user" the profile the login API returned.
// The API checks the token on every call, so these cookies only drive what the UI shows.
export const getToken = () => cookies().get('session')?.value || '';

export function getCurrentUser() {
  if (!getToken()) return null;
  try {
    const user = JSON.parse(cookies().get('user')?.value || '');
    return user && user.email ? user : null;
  } catch {
    return null;
  }
}

export const isManager = (user) => user && (user.role === 'admin' || user.role === 'manager');
export const isAdmin = (user) => user && user.role === 'admin';

// Call the Kyolex API as the signed-in user.
export const call = (method, path, opts = {}) => remote(method, path, { ...opts, token: getToken() });

export const json = (data, status = 200) => NextResponse.json(data, { status });
export const unauthorized = () => json({ error: 'Please sign in again.' }, 401);
export const forbidden = () => json({ error: 'You do not have access to this.' }, 403);
// Pass an API failure on to the page with the API's own message, plus its per-field validation notes.
export function fail(r) {
  const d = r.data?.data;
  const details = d && typeof d === 'object' && !Array.isArray(d) ? Object.values(d).filter((v) => typeof v === 'string') : [];
  const error = details.length ? details.join(' ') : r.data?.message || 'Something went wrong. Try again.';
  return json({ error }, r.status >= 400 && r.status < 500 ? r.status : 502);
}

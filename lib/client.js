'use client';

// fetch wrapper for client pages. On 401 it clears the cookie and sends the user to /login.
export async function api(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body,
  });
  if (res.status === 401) {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

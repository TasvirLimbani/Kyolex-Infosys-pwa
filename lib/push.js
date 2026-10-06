import { headers } from 'next/headers';

// Phone alerts go out through OneSignal. Each device signs in to OneSignal with the employee ID
// (lower case) as its external ID and carries "role" and "employee" tags (components/NotificationBell.js),
// so nothing about devices is stored here.
const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const KEY = process.env.ONESIGNAL_REST_API_KEY;
const idOf = (employeeId) => String(employeeId || '').trim().toLowerCase();

// Alerts open an absolute link: APP_URL, or the address this request came in on.
function origin() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  return `${h.get('x-forwarded-proto') || 'https'}://${host}`;
}

// send({ include_aliases | filters }, { title, body, url }) -> { ok, error }. Never throws.
async function send(target, message) {
  if (!APP_ID || !KEY) return { ok: false, error: 'OneSignal keys are not set on the server (.env.local).' };
  try {
    const res = await fetch('https://api.onesignal.com/notifications?c=push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `${KEY.startsWith('os_v2_') ? 'Key' : 'Basic'} ${KEY}` },
      body: JSON.stringify({
        app_id: APP_ID,
        target_channel: 'push',
        ...target,
        headings: { en: message.title },
        contents: { en: message.body || message.title },
        url: origin() + (message.url || '/tasks'),
        priority: 10, // wake a sleeping phone
        ttl: 24 * 60 * 60,
      }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    // OneSignal answers 200 with an empty id when nobody was subscribed.
    if (res.ok && data.id) return { ok: true };
    const why = data.errors ? (typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors)) : `no reply (${res.status})`;
    console.error('OneSignal push failed:', res.status, why);
    return { ok: false, error: `OneSignal answered ${res.status}: ${why.slice(0, 200)}` };
  } catch (e) {
    console.error('OneSignal push failed:', e.message);
    return { ok: false, error: `OneSignal could not be reached: ${e.message}` };
  }
}

export const pushToEmployee = (employeeId, message) =>
  send({ include_aliases: { external_id: [idOf(employeeId)] } }, message);

// Every admin and manager device, except the one who made the change.
export function pushToManagers(exceptEmployeeId, message) {
  const notMe = { field: 'tag', key: 'employee', relation: '!=', value: idOf(exceptEmployeeId) };
  return send(
    {
      filters: [
        { field: 'tag', key: 'role', relation: '=', value: 'admin' }, notMe,
        { operator: 'OR' },
        { field: 'tag', key: 'role', relation: '=', value: 'manager' }, notMe,
      ],
    },
    message
  );
}

export const pushTest = (employeeId) =>
  pushToEmployee(employeeId, { title: 'Alerts are working', body: 'This device will get task alerts.', url: '/tasks' });

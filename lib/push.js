import fs from 'fs';
import path from 'path';
import webpush from 'web-push';

// Web Push. Device subscriptions and the server's VAPID keys are kept in data/push.json
// (the Kyolex API has no place to store them). No task or employee data is stored here.
const FILE = path.join(process.cwd(), 'data', 'push.json');
const same = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

function read() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    const store = { vapid: webpush.generateVAPIDKeys(), subs: [] };
    write(store);
    return store;
  }
}

function write(store) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(store, null, 2));
  fs.renameSync(FILE + '.tmp', FILE);
}

export const publicKey = () => read().vapid.publicKey;

// One device belongs to whoever signed in on it last.
export function saveSubscription(user, sub) {
  if (!sub?.endpoint || !sub.keys) return;
  const store = read();
  store.subs = store.subs.filter((s) => s.endpoint !== sub.endpoint);
  store.subs.push({ endpoint: sub.endpoint, keys: sub.keys, employeeId: user.employeeId, role: user.role });
  write(store);
}

export function removeSubscription(endpoint) {
  const store = read();
  const subs = store.subs.filter((s) => s.endpoint !== endpoint);
  if (subs.length !== store.subs.length) write({ ...store, subs });
}

// "high" urgency wakes a sleeping phone; without it Android holds the alert until the phone is next used.
const sendOptions = (store) => ({
  vapidDetails: { subject: process.env.PUSH_CONTACT || 'mailto:admin@kyolex.com', ...store.vapid },
  TTL: 24 * 60 * 60,
  urgency: 'high',
  timeout: 8000,
});

// 404/410: the device unsubscribed. 403: it subscribed with other VAPID keys; it subscribes again on next open.
const isDead = (e) => [403, 404, 410].includes(e.statusCode);

// pushTo((sub) => ..., { title, body, url }): send to every matching device. Never throws.
export async function pushTo(match, message) {
  try {
    const store = read();
    const targets = store.subs.filter(match);
    if (!targets.length) return;
    const options = sendOptions(store);
    const gone = [];
    await Promise.all(
      targets.map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(message), options).catch((e) => {
          console.error('Push to', s.employeeId, 'failed:', e.statusCode || '', e.body || e.message);
          if (isDead(e)) gone.push(s.endpoint);
        })
      )
    );
    if (gone.length) {
      const fresh = read();
      write({ ...fresh, subs: fresh.subs.filter((s) => !gone.includes(s.endpoint)) });
    }
  } catch (e) {
    console.error('Push failed:', e.message);
  }
}

// Send one alert to a single device and say whether the push service took it.
export async function pushTest(sub) {
  try {
    const message = { title: 'Alerts are working', body: 'This device will get task alerts.', url: '/tasks' };
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(message), sendOptions(read()));
    return { ok: true };
  } catch (e) {
    if (isDead(e)) removeSubscription(sub.endpoint);
    return { ok: false, error: `Push service answered ${e.statusCode || 'no reply'}: ${String(e.body || e.message).trim().slice(0, 160)}` };
  }
}

export const pushToEmployee = (employeeId, message) => pushTo((s) => same(s.employeeId, employeeId), message);
export const pushToManagers = (exceptEmployeeId, message) =>
  pushTo((s) => (s.role === 'admin' || s.role === 'manager') && !same(s.employeeId, exceptEmployeeId), message);

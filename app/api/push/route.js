import { getCurrentUser, json, unauthorized } from '@/lib/auth';
import { publicKey, saveSubscription, removeSubscription, pushTest } from '@/lib/push';

export const dynamic = 'force-dynamic';

// GET: the key a browser needs to subscribe
export async function GET() {
  if (!getCurrentUser()) return unauthorized();
  return json({ publicKey: publicKey() });
}

// POST { subscription, test }: this device receives alerts for the signed-in user; "test" sends one now
export async function POST(req) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  const b = await req.json().catch(() => ({}));
  if (!b.subscription?.endpoint || !b.subscription.keys) return json({ error: 'This device gave no push subscription.' }, 400);
  saveSubscription(user, b.subscription);
  return json(b.test ? await pushTest(b.subscription) : { ok: true });
}

// DELETE { endpoint }: stop alerts on this device (sign out)
export async function DELETE(req) {
  const b = await req.json().catch(() => ({}));
  if (b.endpoint) removeSubscription(b.endpoint);
  return json({ ok: true });
}

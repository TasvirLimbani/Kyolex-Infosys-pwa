import { getCurrentUser, json, unauthorized } from '@/lib/auth';
import { publicKey, saveSubscription, removeSubscription } from '@/lib/push';

export const dynamic = 'force-dynamic';

// GET: the key a browser needs to subscribe
export async function GET() {
  if (!getCurrentUser()) return unauthorized();
  return json({ publicKey: publicKey() });
}

// POST { subscription }: this device receives alerts for the signed-in user
export async function POST(req) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  const b = await req.json().catch(() => ({}));
  saveSubscription(user, b.subscription);
  return json({ ok: true });
}

// DELETE { endpoint }: stop alerts on this device (sign out)
export async function DELETE(req) {
  const b = await req.json().catch(() => ({}));
  if (b.endpoint) removeSubscription(b.endpoint);
  return json({ ok: true });
}

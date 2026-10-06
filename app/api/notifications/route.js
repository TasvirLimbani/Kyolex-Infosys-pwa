import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser, json, unauthorized } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  const db = readDB();
  const mine = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.id - a.id);
  return json({ notifications: mine.slice(0, 30), unread: mine.filter((n) => !n.read).length });
}

// PUT { ids: [1,2] } or { all: true }  -> mark as read
export async function PUT(req) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  const b = await req.json().catch(() => ({}));
  const ids = new Set((b.ids || []).map(Number));
  const db = readDB();
  db.notifications.forEach((n) => {
    if (n.userId === user.id && (b.all || ids.has(n.id))) n.read = true;
  });
  writeDB(db);
  return json({ ok: true });
}

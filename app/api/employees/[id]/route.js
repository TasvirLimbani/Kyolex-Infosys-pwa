import { getCurrentUser, isAdmin, call, json, fail, unauthorized, forbidden } from '@/lib/auth';
import { one, toEmployee, employeeBody } from '@/lib/remote';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();

  const id = Number(params.id);
  const b = await req.json().catch(() => ({}));
  if (id === user.id && (b.role !== 'admin' || b.status !== 'active')) {
    return json({ error: 'You cannot remove your own admin access or deactivate yourself.' }, 400);
  }

  const body = { id, ...employeeBody(b) }; // password is only sent when a new one was typed
  const r = await call('PUT', 'employee/edit.php', { body });
  if (!r.ok) return fail(r);
  return json({ employee: toEmployee({ ...body, ...one(r.data, 'employee', 'user') }) });
}

export async function DELETE(_req, { params }) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();

  const id = Number(params.id);
  if (id === user.id) return json({ error: 'You cannot delete your own account.' }, 400);
  const r = await call('DELETE', 'employee/delete.php', { query: { id } });
  if (!r.ok) return fail(r);
  return json({ ok: true });
}

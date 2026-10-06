import { getCurrentUser, isManager, call, json, fail, unauthorized, forbidden } from '@/lib/auth';
import { one, toTask, taskBody } from '@/lib/remote';
import { canSee, withNames, taskNotice, taskUrl } from '@/lib/helpers';
import { pushToEmployee, pushToManagers } from '@/lib/push';
import { STATUSES, labelOf } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const same = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

export async function GET(_req, { params }) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  const r = await call('GET', 'task/get.php', { query: { id: params.id } });
  if (!r.ok) return fail(r);
  const task = toTask(one(r.data, 'task'));
  if (!canSee(user, task)) return forbidden();
  return json({ task: (await withNames(user, [task]))[0] });
}

export async function PUT(req, { params }) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  const id = Number(params.id);
  let b = await req.json().catch(() => ({}));

  // The task as it is now: needed for the employee's partial edit and to see what changed.
  const cur = await call('GET', 'task/get.php', { query: { id } });
  if (!cur.ok) return fail(cur);
  const before = toTask(one(cur.data, 'task'));

  // Employees can only change the status and amount of their own tasks.
  if (!isManager(user)) {
    if (!canSee(user, before)) return forbidden();
    if (!STATUSES.some((s) => s.value === b.status)) return json({ error: 'Pick a status.' }, 400);
    const amount = b.amount === undefined ? before.amount : Number(b.amount);
    if (b.amount === '' || !Number.isFinite(amount) || amount < 0) return json({ error: 'Enter a valid amount.' }, 400);
    b = { ...before, status: b.status, amount };
  }

  const body = { id, ...taskBody(b) };
  const r = await call('PUT', 'task/edit.php', { body });
  if (!r.ok) return fail(r);
  const { id: _id, invoiceNo, date, assigneeName, completedOn, ...sent } = toTask(body);
  const task = { ...before, ...sent };

  if (!isManager(user)) {
    const what = before.status !== task.status ? `marked ${task.invoiceNo} ${labelOf(STATUSES, task.status).toLowerCase()}` : `updated ${task.invoiceNo}`;
    await pushToManagers(user.employeeId, { title: `${user.name} ${what}`, body: taskNotice(task), url: taskUrl(task) });
  } else if (!same(before.assigneeId, task.assigneeId) && !same(task.assigneeId, user.employeeId)) {
    await pushToEmployee(task.assigneeId, { title: 'New task assigned to you', body: taskNotice(task), url: taskUrl(task) });
  }
  return json({ task });
}

export async function DELETE(_req, { params }) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  if (!isManager(user)) return forbidden();
  const r = await call('DELETE', 'task/delete.php', { query: { id: params.id } });
  if (!r.ok) return fail(r);
  return json({ ok: true });
}

import { getCurrentUser, isManager, call, json, fail, unauthorized, forbidden } from '@/lib/auth';
import { rows, one, toTask, taskBody, apiStatus } from '@/lib/remote';
import { visibleTo, withNames, taskNotice, taskUrl } from '@/lib/helpers';
import { pushToEmployee } from '@/lib/push';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 100;

// GET /api/tasks?month=2026-10&date=2026-10-06&status=pending&q=text
export async function GET(req) {
  const user = getCurrentUser();
  if (!user) return unauthorized();

  const sp = req.nextUrl.searchParams;
  const date = sp.get('date'); // one day; its month is read from the API
  const month = date ? date.slice(0, 7) : sp.get('month');
  const status = sp.get('status');
  const q = (sp.get('q') || '').trim().toLowerCase();

  // One month: the month list, read page by page (the API allows 100 per page). All months: the filter list.
  let found = [];
  if (month) {
    for (let page = 1; page <= 50; page++) {
      const r = await call('GET', 'task/list.php', { query: { month, page, limit: PAGE_SIZE } });
      if (!r.ok) return fail(r);
      const batch = rows(r.data, 'tasks');
      found = found.concat(batch);
      if (batch.length < PAGE_SIZE) break;
    }
  } else {
    const r = await call('GET', 'task/filter.php', { query: { status: apiStatus(status) } });
    if (!r.ok) return fail(r);
    found = rows(r.data, 'tasks');
  }

  let tasks = visibleTo(user, found.map(toTask));
  if (date) tasks = tasks.filter((t) => t.date === date);
  if (status) tasks = tasks.filter((t) => t.status === status);
  tasks = await withNames(user, tasks);
  if (q) {
    tasks = tasks.filter((t) =>
      [String(t.id), t.invoiceNo, t.partyName, t.partyNumber, t.assigneeName].some((v) =>
        String(v).toLowerCase().includes(q)
      )
    );
  }
  tasks.sort((a, b) => b.id - a.id); // newest ID first: 10, 9, 4, 3 ...
  return json({ tasks });
}

export async function POST(req) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  if (!isManager(user)) return forbidden();

  const body = taskBody(await req.json().catch(() => ({})));
  const r = await call('POST', 'task/add.php', { body });
  if (!r.ok) return fail(r);
  const task = toTask({ ...body, ...one(r.data, 'task') });
  if (task.assigneeId.toLowerCase() !== user.employeeId.toLowerCase()) {
    await pushToEmployee(task.assigneeId, { title: 'New task assigned to you', body: taskNotice(task), url: taskUrl(task) });
  }
  return json({ task }, 201);
}

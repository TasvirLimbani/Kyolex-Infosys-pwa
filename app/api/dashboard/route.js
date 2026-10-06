import { getCurrentUser, call, json, fail, unauthorized } from '@/lib/auth';
import { payload, pick, num, date10, toTask } from '@/lib/remote';
import { toDateStr } from '@/lib/constants';
import { visibleTo, withNames } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

const list = (v) => (Array.isArray(v) ? v : []);

export async function GET(req) {
  const user = getCurrentUser();
  if (!user) return unauthorized();

  const sp = req.nextUrl.searchParams;
  const today = sp.get('today') || toDateStr(new Date());
  const month = sp.get('month') || today.slice(0, 7);

  const r = await call('GET', 'dashboard/index.php', { query: { month, today } });
  if (!r.ok) return fail(r);
  const d = payload(r.data);
  const s = pick(d, 'stats', 'summary', 'cards', 'counts') || d;
  const m = pick(d, 'monthly', 'monthlysummary', 'monthsummary') || {};
  const recent = visibleTo(user, list(pick(d, 'recent', 'todaytasks', 'todaystasks', 'today', 'recenttasks', 'tasks')).map(toTask));

  return json({
    stats: {
      activeEmployees: num(pick(s, 'activeemployees', 'activeemployee', 'totalemployees', 'employees')),
      inProgress: num(pick(s, 'inprogress', 'inprogresstasks', 'tasksinprogress')),
      totalCollected: num(pick(s, 'totalcollected', 'collected', 'totalcollection', 'collectedamount')),
      outstanding: num(pick(s, 'outstanding', 'totaloutstanding', 'outstandingamount', 'pendingamount', 'stilltocollect')),
    },
    activity: list(pick(d, 'activity', 'taskactivity', 'last7days', 'weekly', 'chart')).map((a) => ({
      date: date10(pick(a, 'date', 'day')),
      created: num(pick(a, 'created', 'createdtasks', 'added', 'total')),
      completed: num(pick(a, 'completed', 'completedtasks', 'done')),
    })),
    monthly: {
      month: String(pick(m, 'month') || month).slice(0, 7),
      total: num(pick(m, 'total', 'totaltasks')),
      completed: num(pick(m, 'completed')),
      in_progress: num(pick(m, 'inprogress')),
      pending: num(pick(m, 'pending')),
      cancelled: num(pick(m, 'cancelled', 'canceled')),
    },
    recent: await withNames(user, recent),
  });
}

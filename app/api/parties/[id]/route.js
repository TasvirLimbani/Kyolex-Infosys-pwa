import { getCurrentUser, call, json, fail, unauthorized } from '@/lib/auth';
import { payload, rows, pick, num, date10, toTask } from '@/lib/remote';
import { partySummary, visibleTo, withNames } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

const decode = (s) => {
  try { return decodeURIComponent(s); } catch { return s; }
};

// GET /api/parties/<party name>
export async function GET(_req, { params }) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  const name = decode(params.id);

  const r = await call('GET', 'reports/party-detail.php', { query: { partyname: name } });
  if (!r.ok) return fail(r);
  const d = payload(r.data);
  const tasks = visibleTo(user, rows(r.data, 'tasks').map(toTask)).sort((a, b) => b.id - a.id);
  const p = pick(d, 'party') || d;
  const s = pick(d, 'summary', 'totals') || {};
  const own = partySummary(tasks); // used for any figure the API does not send

  return json({
    party: {
      name: String(pick(p, 'partyname', 'name') || name),
      number: String(pick(p, 'parrtynumber', 'partynumber', 'number', 'phone') || tasks[0]?.partyNumber || ''),
    },
    summary: {
      totalTasks: num(pick(s, 'totaltasks', 'totaltask', 'taskcount') ?? own.totalTasks),
      totalAmount: num(pick(s, 'totalamount', 'billed') ?? own.totalAmount),
      collected: num(pick(s, 'collected', 'collectedamount') ?? own.collected),
      outstanding: num(pick(s, 'outstanding', 'outstandingamount') ?? own.outstanding),
      lastDate: date10(pick(s, 'lastdate', 'lasttaskdate')) || own.lastDate,
    },
    tasks: await withNames(user, tasks),
  });
}

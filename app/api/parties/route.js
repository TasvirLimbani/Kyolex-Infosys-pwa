import { getCurrentUser, call, json, fail, unauthorized } from '@/lib/auth';
import { payload, rows, pick, num, date10 } from '@/lib/remote';

export const dynamic = 'force-dynamic';

const sum = (list, key) => list.reduce((s, p) => s + p[key], 0);

// GET: party-wise report. A party is identified by its name.
export async function GET() {
  const user = getCurrentUser();
  if (!user) return unauthorized();

  const r = await call('GET', 'reports/partywise.php');
  if (!r.ok) return fail(r);

  const parties = rows(r.data, 'parties', 'report', 'reports')
    .map((p) => {
      const name = String(pick(p, 'partyname', 'name', 'party') || '');
      return {
        id: name,
        name,
        number: String(pick(p, 'parrtynumber', 'partynumber', 'number', 'phone') || ''),
        totalTasks: num(pick(p, 'totaltasks', 'totaltask', 'taskcount', 'tasks', 'count')),
        totalAmount: num(pick(p, 'totalamount', 'billed', 'amount', 'total')),
        collected: num(pick(p, 'collected', 'collectedamount', 'completedamount', 'paid')),
        outstanding: num(pick(p, 'outstanding', 'outstandingamount', 'pendingamount', 'due')),
        lastDate: date10(pick(p, 'lastdate', 'lasttask', 'lasttaskdate', 'lastduedate')),
      };
    })
    .filter((p) => p.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  const t = pick(payload(r.data), 'totals', 'summary', 'total');
  return json({
    parties,
    totals: {
      totalAmount: num(pick(t, 'totalamount', 'billed', 'amount')) || sum(parties, 'totalAmount'),
      collected: num(pick(t, 'collected', 'collectedamount')) || sum(parties, 'collected'),
      outstanding: num(pick(t, 'outstanding', 'outstandingamount')) || sum(parties, 'outstanding'),
    },
  });
}

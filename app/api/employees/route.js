import { getCurrentUser, isManager, isAdmin, call, json, fail, unauthorized, forbidden } from '@/lib/auth';
import { rows, one, toEmployee, employeeBody } from '@/lib/remote';

export const dynamic = 'force-dynamic';

// GET /api/employees?active=1
export async function GET(req) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  if (!isManager(user)) return forbidden();

  const r = await call('GET', 'employee/list.php');
  if (!r.ok) return fail(r);
  let list = rows(r.data, 'employees').map(toEmployee);
  if (req.nextUrl.searchParams.get('active')) list = list.filter((e) => e.status === 'active');
  return json({ employees: list.sort((a, b) => b.id - a.id) });
}

export async function POST(req) {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();

  const body = employeeBody(await req.json().catch(() => ({})));
  const r = await call('POST', 'employee/add.php', { body });
  if (!r.ok) return fail(r);
  return json({ employee: toEmployee({ ...body, ...one(r.data, 'employee', 'user') }) }, 201);
}

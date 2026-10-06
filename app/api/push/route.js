import { getCurrentUser, json, unauthorized } from '@/lib/auth';
import { pushTest } from '@/lib/push';

export const dynamic = 'force-dynamic';

// POST: send a test alert to the signed-in user's devices
export async function POST() {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  return json(await pushTest(user.employeeId));
}

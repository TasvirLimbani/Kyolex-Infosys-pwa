import { getCurrentUser, json, unauthorized } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = getCurrentUser();
  if (!user) return unauthorized();
  return json({ user });
}

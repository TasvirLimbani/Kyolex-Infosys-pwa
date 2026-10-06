import { readDB } from '@/lib/db';
import { getCurrentUser, json, unauthorized } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Preview of the invoice number the next new task will get.
export async function GET() {
  if (!getCurrentUser()) return unauthorized();
  const db = readDB();
  const seq = (db.counters.invoice || 0) + 1;
  return json({ invoiceNo: `INV-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}` });
}

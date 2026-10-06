import { ROLES, EMP_STATUSES } from './constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s-]{6,17}$/;

export function validateEmployee(b, db, { id = null, requirePassword = true } = {}) {
  if (!String(b.name || '').trim()) return 'Enter the employee name.';
  if (!EMAIL_RE.test(String(b.email || '').trim())) return 'Enter a valid email.';
  if (!String(b.employeeId || '').trim()) return 'Enter the employee ID.';
  if (requirePassword || b.password) {
    if (String(b.password || '').length < 6) return 'Password must be at least 6 characters.';
  }
  if (!ROLES.some((r) => r.value === b.role)) return 'Pick a role.';
  if (!EMP_STATUSES.some((s) => s.value === b.status)) return 'Pick a status.';
  const email = String(b.email).trim().toLowerCase();
  const code = String(b.employeeId).trim().toLowerCase();
  if (db.employees.some((e) => e.id !== id && e.email.toLowerCase() === email)) return 'This email is already used.';
  if (db.employees.some((e) => e.id !== id && e.employeeId.toLowerCase() === code)) return 'This employee ID is already used.';
  return null;
}

export const publicEmployee = (db, e) => {
  const { password, ...rest } = e;
  return { ...rest, taskCount: db.tasks.filter((t) => t.assigneeId === e.id).length };
};

export function validateParty(b, db, id = null) {
  const name = String(b.name || '').trim();
  if (!name) return 'Enter the party name.';
  if (!PHONE_RE.test(String(b.number || '').trim())) return 'Enter a valid phone number.';
  if (b.email && !EMAIL_RE.test(String(b.email).trim())) return 'Email is not valid.';
  if (db.parties.some((p) => p.id !== id && p.name.toLowerCase() === name.toLowerCase())) return 'A party with this name already exists.';
  return null;
}

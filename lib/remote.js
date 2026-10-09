import { toDateStr } from './constants';

// Kyolex Infosys API. Called from the server only (the API sends no CORS headers).
const BASE = (process.env.KYOLEX_API_URL || 'http://kyolexinfosys.soon.it/api').replace(/\/$/, '');

// remote('GET', 'task/list.php', { token, query: { month } }) -> { ok, status, data }. Never throws.
export async function remote(method, path, { token, query, body } = {}) {
  const url = new URL(`${BASE}/${path}`);
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  try {
    const res = await fetch(url, {
      method,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: method === 'GET' ? undefined : JSON.stringify(body || {}),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.success !== false, status: res.status, data };
  } catch (e) {
    console.error('Kyolex API unreachable:', `${method} ${url.origin}${url.pathname}`, e?.cause?.code || e?.name, e?.message);
    return { ok: false, status: 502, data: { message: 'Could not reach the server. Try again.' } };
  }
}

export const remoteLogin = (email, password) => remote('POST', 'auth/login.php', { body: { email, password } });
export const remoteLogout = (token) => remote('POST', 'auth/logout.php', { token });

// ---------- reading replies ----------
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const norm = (k) => String(k).toLowerCase().replace(/[_\s-]/g, '');

// Field lookup that ignores case and underscores: pick(t, 'duedate') matches dueDate, due_date, DueDate.
export function pick(o, ...names) {
  if (!isObj(o)) return undefined;
  const keys = Object.keys(o);
  for (const n of names) {
    const k = keys.find((key) => norm(key) === n);
    if (k !== undefined && o[k] !== null && o[k] !== '') return o[k];
  }
  return undefined;
}

// The payload of a reply: { success, message, data: {...} } -> data
export const payload = (data) => (data && data.data !== undefined && data.data !== null ? data.data : data || {});

// The list inside a reply, wherever the API put it.
export function rows(data, ...names) {
  const d = payload(data);
  if (Array.isArray(d)) return d;
  const named = pick(d, ...names, 'tasks', 'employees', 'parties', 'list', 'items', 'records', 'rows', 'data');
  if (Array.isArray(named)) return named;
  return Object.values(isObj(d) ? d : {}).find(Array.isArray) || [];
}

// The single record inside a reply.
export function one(data, ...names) {
  const d = payload(data);
  const named = pick(d, ...names);
  if (isObj(named)) return named;
  return isObj(d) ? d : {};
}

export const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const date10 = (v) => (/^\d{4}-\d{2}-\d{2}/.test(String(v || '')) ? String(v).slice(0, 10) : '');

// ---------- API record <-> app record ----------
const ROLE_MAP = { admin: 'admin', superadmin: 'admin', manager: 'manager', employee: 'employee', staff: 'employee', user: 'employee' };
export const mapRole = (role) => ROLE_MAP[norm(role || '')] || 'employee';

export function toEmployee(e) {
  return {
    id: num(pick(e, 'id')),
    employeeId: String(pick(e, 'employeeid') || ''),
    name: String(pick(e, 'employeename', 'name') || ''),
    email: String(pick(e, 'email') || ''),
    role: mapRole(pick(e, 'role')),
    status: String(pick(e, 'status') || 'active').toLowerCase() === 'active' ? 'active' : 'inactive',
    taskCount: num(pick(e, 'taskcount', 'totaltasks')),
  };
}

export function employeeBody(b) {
  const body = {
    employeeName: String(b.name || '').trim(),
    email: String(b.email || '').trim(),
    employeeId: String(b.employeeId || '').trim(),
    Status: b.status,
    Role: b.role,
  };
  if (b.password) body.password = b.password;
  return body;
}

// The API says "in progress" and "highest" where the app says in_progress and urgent.
export const apiStatus = (s) => (s === 'in_progress' ? 'in progress' : s);
const apiPriority = (p) => (p === 'urgent' ? 'highest' : p);
const PRIORITY_MAP = { low: 'low', medium: 'medium', high: 'high', highest: 'urgent', urgent: 'urgent' };
const STATUS_MAP = { pending: 'pending', inprogress: 'in_progress', completed: 'completed', complete: 'completed', cancelled: 'cancelled', canceled: 'cancelled' };

export function toTask(t) {
  const id = num(pick(t, 'id', 'taskid'));
  const dueDate = date10(pick(t, 'duedate'));
  return {
    id,
    invoiceNo: String(pick(t, 'invoiceno', 'invoicenumber', 'invoice') || `#${id}`),
    partyName: String(pick(t, 'partyname', 'party') || ''),
    partyNumber: String(pick(t, 'parrtynumber', 'partynumber', 'partyphone', 'phone') || ''),
    date: date10(pick(t, 'date', 'taskdate', 'createdat', 'createdon', 'created')) || dueDate || toDateStr(new Date()),
    dueDate,
    status: STATUS_MAP[norm(pick(t, 'status') || '')] || 'pending',
    amount: num(pick(t, 'amount')),
    assigneeId: String(pick(t, 'assignto', 'assignedto', 'assigneeid') || ''), // employee code, e.g. EMP002
    assigneeName: String(pick(t, 'assigntoname', 'assigneename', 'assignedname', 'employeename') || ''),
    priority: PRIORITY_MAP[norm(pick(t, 'priority') || '')] || 'medium',
    notes: String(pick(t, 'note', 'notes') || ''),
    employeeNote: String(pick(t, 'employeenote', 'employee_note') || ''),
    completedOn: date10(pick(t, 'completedon', 'completedat', 'completeddate')) || null,
  };
}

// "parrtynumber" is the API's own spelling.
export function taskBody(b) {
  return {
    partyname: String(b.partyName || '').trim(),
    parrtynumber: String(b.partyNumber || '').trim(),
    duedate: b.dueDate,
    status: apiStatus(b.status),
    amount: num(b.amount),
    assignTo: String(b.assigneeId || ''),
    priority: apiPriority(b.priority),
    note: String(b.notes || '').trim(),
    employee_note: String(b.employeeNote || '').trim(),
  };
}

import { call, isManager } from './auth';
import { rows, toEmployee } from './remote';
import { money, prettyDate } from './constants';

const same = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

// Employees only see tasks assigned to their own employee ID.
export const visibleTo = (user, tasks) =>
  isManager(user) ? tasks : tasks.filter((t) => !t.assigneeId || same(t.assigneeId, user.employeeId));

export const canSee = (user, task) => visibleTo(user, [task]).length === 1;

// The task API returns the assignee as an employee ID; fill in the name for display.
export async function withNames(user, tasks) {
  if (tasks.every((t) => t.assigneeName || !t.assigneeId)) return tasks;
  let employees = [{ employeeId: user.employeeId, name: user.name }];
  if (isManager(user)) {
    const r = await call('GET', 'employee/list.php');
    if (r.ok) employees = rows(r.data, 'employees').map(toEmployee);
  }
  return tasks.map((t) => {
    if (t.assigneeName) return t;
    const emp = employees.find((e) => same(e.employeeId, t.assigneeId));
    return { ...t, assigneeName: emp?.name || t.assigneeId };
  });
}

// Text and link of a push alert about a task. Tapping the alert opens that task.
export const taskNotice = (t) => `${t.partyName}, ${money(t.amount)}${t.dueDate ? `, due ${prettyDate(t.dueDate)}` : ''}`;
export const taskUrl = (t) => (t.id ? `/tasks?task=${t.id}` : '/tasks');

export function partySummary(tasks) {
  const live = tasks.filter((t) => t.status !== 'cancelled');
  return {
    totalTasks: tasks.length,
    totalAmount: live.reduce((s, t) => s + Number(t.amount || 0), 0),
    collected: tasks.filter((t) => t.status === 'completed').reduce((s, t) => s + Number(t.amount || 0), 0),
    outstanding: tasks
      .filter((t) => t.status === 'pending' || t.status === 'in_progress')
      .reduce((s, t) => s + Number(t.amount || 0), 0),
    lastDate: tasks.reduce((m, t) => (t.date > m ? t.date : m), ''),
  };
}

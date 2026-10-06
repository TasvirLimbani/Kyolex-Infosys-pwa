'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { STATUSES, PRIORITIES, todayStr, prettyDate } from '@/lib/constants';

const EMPTY = { partyName: '', partyNumber: '', dueDate: '', status: 'pending', amount: '', assigneeId: '', priority: 'medium', notes: '' };

export default function TaskForm({ task, onSaved, onDelete }) {
  const editing = Boolean(task);
  const [form, setForm] = useState(editing ? { ...EMPTY, ...task, amount: String(task.amount) } : EMPTY);
  const invoiceNo = task?.invoiceNo || 'Assigned on save';
  const [employees, setEmployees] = useState([]);
  const [parties, setParties] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const date = task?.date || todayStr();

  useEffect(() => {
    api('/api/employees?active=1').then((d) => setEmployees(d.employees)).catch(() => {});
    api('/api/parties').then((d) => setParties(d.parties)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function onPartyName(e) {
    const name = e.target.value;
    const match = parties.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    setForm((f) => ({ ...f, partyName: name, partyNumber: match ? match.number : f.partyNumber }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { ...form, date, today: todayStr() };
      const d = editing
        ? await api(`/api/tasks/${task.id}`, { method: 'PUT', body })
        : await api('/api/tasks', { method: 'POST', body });
      onSaved(d.task);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Tasks are assigned by employee ID (EMP002). Keep the current (possibly inactive) assignee visible when editing.
  const assigneeOptions = [...employees];
  if (editing && task.assigneeId && !employees.some((e) => e.employeeId === task.assigneeId)) {
    assigneeOptions.push({ id: task.assigneeId, name: `${task.assigneeName || task.assigneeId} (inactive)`, employeeId: task.assigneeId });
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <label className="field">
        <span>Invoice number</span>
        <input value={invoiceNo} readOnly className="readonly" />
      </label>
      <label className="field">
        <span>Date</span>
        <input value={prettyDate(date)} readOnly className="readonly" />
      </label>

      <label className="field span-2">
        <span>Party name</span>
        <input list="party-list" value={form.partyName} onChange={onPartyName} placeholder="Type or pick a party" required />
        <datalist id="party-list">
          {parties.map((p) => <option key={p.id} value={p.name} />)}
        </datalist>
      </label>
      <label className="field">
        <span>Phone number</span>
        <input type="tel" inputMode="tel" value={form.partyNumber} onChange={set('partyNumber')} placeholder="98765 43210" required />
      </label>
      <label className="field">
        <span>Amount (₹)</span>
        <input type="number" inputMode="decimal" min="0" step="0.01" value={form.amount} onChange={set('amount')} required />
      </label>

      <label className="field">
        <span>Due date</span>
        <input type="date" min={date} value={form.dueDate} onChange={set('dueDate')} required />
      </label>
      <label className="field">
        <span>Assignee</span>
        <select value={form.assigneeId} onChange={set('assigneeId')} required>
          <option value="">Select employee</option>
          {assigneeOptions.map((e) => (
            <option key={e.id} value={e.employeeId}>{e.name}{e.employeeId ? ` (${e.employeeId})` : ''}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Status</span>
        <select value={form.status} onChange={set('status')}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Priority</span>
        <select value={form.priority} onChange={set('priority')}>
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </label>

      <label className="field span-2">
        <span>Notes (optional)</span>
        <textarea rows="2" value={form.notes} onChange={set('notes')} />
      </label>

      {error && <p className="form-error span-2" role="alert">{error}</p>}

      <div className="form-actions span-2">
        {editing && onDelete && (
          <button type="button" className="btn btn-danger-ghost" onClick={onDelete}>Delete task</button>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add task'}
        </button>
      </div>
    </form>
  );
}

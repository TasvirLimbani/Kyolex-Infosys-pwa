'use client';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/client';
import { STATUSES, PRIORITIES, labelOf, money, monthStr, prettyMonth, prettyDate, todayStr } from '@/lib/constants';
import { useUser, canManage } from '@/components/UserContext';
import TaskRow from '@/components/TaskRow';
import TaskForm from '@/components/TaskForm';
import Modal from '@/components/Modal';
import Icon from '@/components/Icon';
import { StatusBadge, PriorityBadge } from '@/components/Badges';

function StatusUpdate({ task, onSaved }) {
  const [status, setStatus] = useState(task.status);
  const [amount, setAmount] = useState(String(task.amount));
  const [employeeNote, setEmployeeNote] = useState(task.employeeNote || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const d = await api(`/api/tasks/${task.id}`, { method: 'PUT', body: { status, amount, employeeNote } });
      onSaved(d.task);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const dirty = status !== task.status || Number(amount) !== task.amount || employeeNote !== (task.employeeNote || '');

  return (
    <div className="task-view">
      <div className="tv-head">
        <div>
          <span className="tv-invoice">{task.invoiceNo}</span>
          <h3>{task.partyName}</h3>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {task.partyNumber && (
        <a className="tv-call" href={`tel:${task.partyNumber.replace(/[^\d+]/g, '')}`}>
          <Icon name="phone" size={18} /> Call {task.partyNumber}
        </a>
      )}

      <dl className="detail-grid tv-facts">
        <div><dt>Date</dt><dd>{prettyDate(task.date)}</dd></div>
        <div><dt>Due</dt><dd>{prettyDate(task.dueDate)}</dd></div>
        <div><dt>Priority</dt><dd className="tv-prio"><PriorityBadge priority={task.priority} />{labelOf(PRIORITIES, task.priority)}</dd></div>
      </dl>

      {task.notes && <p className="tv-notes">{task.notes}</p>}
      {task.employeeNote && <p className="tv-notes"><strong>Employee note:</strong> {task.employeeNote}</p>}

      <div className="tv-edit">
        <label className="field">
          <span>Amount (₹)</span>
          <input type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <div className="field">
          <span>Status</span>
          <div className="status-picker" role="radiogroup" aria-label="Update status">
            {STATUSES.map((s) => (
              <button key={s.value} type="button" role="radio" aria-checked={status === s.value}
                className={`chip sp-${s.value} ${status === s.value ? 'chip-on' : ''}`} onClick={() => setStatus(s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <label className="field span-2">
          <span>Employee note (optional)</span>
          <textarea rows="2" value={employeeNote} onChange={(e) => setEmployeeNote(e.target.value)} />
        </label>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" onClick={save} disabled={saving || amount === '' || !dirty}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

function TasksInner() {
  const user = useUser();
  const manager = canManage(user);
  const router = useRouter();
  const params = useSearchParams();
  const [month, setMonth] = useState(monthStr());
  const [day, setDay] = useState(manager ? '' : todayStr()); // employees start on today's tasks
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [tasks, setTasks] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'add' } | { mode: 'edit', task }
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    if (day) sp.set('date', day);
    else if (month) sp.set('month', month);
    if (status) sp.set('status', status);
    if (q.trim()) sp.set('q', q.trim());
    try {
      const d = await api(`/api/tasks?${sp}`);
      setTasks(d.tasks);
    } catch (e) {
      setError(e.message);
    }
  }, [month, day, status, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  // open a task from ?task=ID (notification / dashboard link)
  const openId = params.get('task');
  useEffect(() => {
    if (!openId) return;
    api(`/api/tasks/${openId}`)
      .then((d) => setModal({ mode: 'edit', task: d.task }))
      .catch((e) => setError(e.message));
  }, [openId]);

  function closeModal() {
    setModal(null);
    if (openId) router.replace('/tasks');
  }

  function onSaved() {
    closeModal();
    load();
  }

  async function onDelete() {
    const t = modal.task;
    if (!confirm(`Delete task #${t.id} (${t.invoiceNo})? This cannot be undone.`)) return;
    try {
      await api(`/api/tasks/${t.id}`, { method: 'DELETE' });
      onSaved();
    } catch (e) {
      alert(e.message);
    }
  }

  // group by month (list is already newest ID first)
  const groups = useMemo(() => {
    const map = new Map();
    (tasks || []).forEach((t) => {
      const m = t.date.slice(0, 7);
      if (!map.has(m)) map.set(m, []);
      map.get(m).push(t);
    });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [tasks]);

  return (
    <div className="page">
      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, invoice, party, phone" aria-label="Search tasks" />
        </div>
        <div className="filters">
          {!manager && (
            <>
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} aria-label="Date" className="month-input" />
              <button className={`chip ${day ? '' : 'chip-on'}`} onClick={() => setDay(day ? '' : todayStr())}>
                {day ? 'All dates' : 'Today'}
              </button>
            </>
          )}
          {!day && (
            <>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month" className="month-input" />
              <button className={`chip ${month ? '' : 'chip-on'}`} onClick={() => setMonth(month ? '' : monthStr())}>
                {month ? 'All months' : 'This month'}
              </button>
            </>
          )}
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        {manager && (
          <button className="btn btn-primary add-btn" onClick={() => setModal({ mode: 'add' })}>
            <Icon name="plus" size={18} /> Add task
          </button>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}
      {!tasks ? (
        <div className="loading">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <div className="empty-block">
          <p>No tasks match these filters.</p>
          {manager && <button className="btn btn-primary" onClick={() => setModal({ mode: 'add' })}>Add a task</button>}
        </div>
      ) : (
        groups.map(([m, list]) => (
          <section key={m} className="month-group">
            <div className="month-head">
              <h3>{prettyMonth(m)}</h3>
              <span className="muted">
                {list.length} {list.length === 1 ? 'task' : 'tasks'}, {money(list.filter((t) => t.status !== 'cancelled').reduce((s, t) => s + t.amount, 0))}
              </span>
            </div>
            <div className="task-list">
              {list.map((t) => <TaskRow key={t.id} task={t} onClick={() => setModal({ mode: 'edit', task: t })} />)}
            </div>
          </section>
        ))
      )}

      {manager && <button className="fab" onClick={() => setModal({ mode: 'add' })} aria-label="Add task"><Icon name="plus" size={26} /></button>}

      {modal && (
        <Modal
          title={modal.mode === 'add' ? 'Add task' : `Task #${modal.task.id}`}
          onClose={closeModal}
          wide
        >
          {modal.mode === 'add' ? (
            <TaskForm onSaved={onSaved} />
          ) : manager ? (
            <TaskForm key={modal.task.id} task={modal.task} onSaved={onSaved} onDelete={onDelete} />
          ) : (
            <StatusUpdate task={modal.task} onSaved={onSaved} />
          )}
        </Modal>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="loading">Loading tasks…</div>}>
      <TasksInner />
    </Suspense>
  );
}

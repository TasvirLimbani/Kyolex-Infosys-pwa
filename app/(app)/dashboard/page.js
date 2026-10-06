'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { money, monthStr, todayStr, prettyMonth, prettyDate } from '@/lib/constants';
import BarChart from '@/components/BarChart';
import TaskRow from '@/components/TaskRow';
import { useUser } from '@/components/UserContext';

const SUMMARY = [
  { key: 'completed', label: 'Completed' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'pending', label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  const [month, setMonth] = useState(monthStr());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/api/dashboard?today=${todayStr()}&month=${month}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [month]);

  if (error) return <p className="form-error">{error}</p>;
  if (!data) return <div className="loading">Loading overview…</div>;

  const { stats, activity, monthly, recent } = data;

  return (
    <div className="dash">
      <section className="greeting">
        <h2>Hello, {user.name.split(' ')[0]}</h2>
        <p className="muted">{prettyDate(todayStr())}</p>
      </section>

      <section className="stats">
        <div className="stat stat-hero">
          <span className="stat-label">Total collected</span>
          <span className="stat-value">{money(stats.totalCollected)}</span>
          <span className="stat-foot">{money(stats.outstanding)} still to collect</span>
        </div>
        <div className="stat">
          <span className="stat-label">Active employees</span>
          <span className="stat-value">{stats.activeEmployees}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Tasks in progress</span>
          <span className="stat-value">{stats.inProgress}</span>
        </div>
      </section>

      <section className="panel panel-chart">
        <div className="panel-head"><h3>Task activity</h3><span className="muted">Last 7 days</span></div>
        {activity.length ? <BarChart data={activity} /> : <p className="empty">No activity yet.</p>}
      </section>

      <section className="panel panel-summary">
        <div className="panel-head">
          <h3>Monthly summary</h3>
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" className="month-input" />
        </div>
        <p className="summary-total"><b>{monthly.total}</b> tasks in {prettyMonth(monthly.month)}</p>
        <ul className="summary-list">
          {SUMMARY.map((s) => {
            const n = monthly[s.key];
            const pct = monthly.total ? Math.round((n / monthly.total) * 100) : 0;
            return (
              <li key={s.key}>
                <span className="summary-label"><i className={`dot st-dot-${s.key}`} />{s.label}</span>
                <span className="summary-count">{n}</span>
                <span className="summary-bar"><span className={`fill st-fill-${s.key}`} style={{ width: `${pct}%` }} /></span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel panel-recent">
        <div className="panel-head">
          <h3>Today's tasks</h3>
          <button className="link-btn" onClick={() => router.push('/tasks')}>View all tasks</button>
        </div>
        {recent.length === 0 ? (
          <p className="empty">No tasks added today.</p>
        ) : (
          <div className="task-list">
            {recent.map((t) => <TaskRow key={t.id} task={t} onClick={() => router.push(`/tasks?task=${t.id}`)} />)}
          </div>
        )}
      </section>
    </div>
  );
}

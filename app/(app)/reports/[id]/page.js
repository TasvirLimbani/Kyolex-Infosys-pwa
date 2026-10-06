'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { money, prettyDate } from '@/lib/constants';
import TaskRow from '@/components/TaskRow';
import Icon from '@/components/Icon';

export default function PartyDetailPage({ params }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // the party name is the id in the URL
  let name = params.id;
  try { name = decodeURIComponent(params.id); } catch {}

  const load = useCallback(() => {
    api(`/api/parties/${encodeURIComponent(name)}`).then(setData).catch((e) => setError(e.message));
  }, [name]);
  useEffect(load, [load]);

  if (error) return (
    <div className="page">
      <Link href="/reports" className="back-link"><Icon name="back" size={18} /> Reports</Link>
      <p className="form-error">{error}</p>
    </div>
  );
  if (!data) return <div className="loading">Loading party…</div>;

  const { party, summary, tasks } = data;

  return (
    <div className="page">
      <Link href="/reports" className="back-link"><Icon name="back" size={18} /> Reports</Link>

      <section className="party-head">
        <div>
          <h2>{party.name}</h2>
          <p className="party-contact">
            <a href={`tel:${party.number}`}><Icon name="phone" size={16} /> {party.number}</a>
          </p>
        </div>
      </section>

      <section className="stats stats-compact">
        <div className="stat"><span className="stat-label">Tasks</span><span className="stat-value">{summary.totalTasks}</span></div>
        <div className="stat"><span className="stat-label">Billed</span><span className="stat-value">{money(summary.totalAmount)}</span></div>
        <div className="stat"><span className="stat-label">Collected</span><span className="stat-value">{money(summary.collected)}</span></div>
        <div className="stat"><span className="stat-label">Outstanding</span><span className="stat-value">{money(summary.outstanding)}</span></div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Tasks for this party</h3>
          {summary.lastDate && <span className="muted">Last on {prettyDate(summary.lastDate)}</span>}
        </div>
        {tasks.length === 0 ? (
          <p className="empty">No tasks for this party yet.</p>
        ) : (
          <div className="task-list">
            {tasks.map((t) => <TaskRow key={t.id} task={t} onClick={() => router.push(`/tasks?task=${t.id}`)} />)}
          </div>
        )}
      </section>

    </div>
  );
}

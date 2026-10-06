'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import { money, prettyDate } from '@/lib/constants';
import Icon from '@/components/Icon';

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api('/api/parties').then(setData).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const rows = (data?.parties || []).filter((p) =>
    (p.name + ' ' + p.number).toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div className="page">
      {data && (
        <section className="stats stats-compact">
          <div className="stat"><span className="stat-label">Parties</span><span className="stat-value">{data.parties.length}</span></div>
          <div className="stat"><span className="stat-label">Billed</span><span className="stat-value">{money(data.totals.totalAmount)}</span></div>
          <div className="stat"><span className="stat-label">Collected</span><span className="stat-value">{money(data.totals.collected)}</span></div>
          <div className="stat"><span className="stat-label">Outstanding</span><span className="stat-value">{money(data.totals.outstanding)}</span></div>
        </section>
      )}

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search party or phone" aria-label="Search parties" />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {!data ? (
        <div className="loading">Loading report…</div>
      ) : rows.length === 0 ? (
        <div className="empty-block">
          <p>{data.parties.length ? 'No party matches your search.' : 'No parties yet. A party appears here when you add a task for it.'}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Party</th><th>Phone</th><th className="num">Tasks</th><th className="num">Billed</th>
                <th className="num">Collected</th><th className="num">Outstanding</th><th>Last task</th><th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="cell-title"><Link href={`/reports/${encodeURIComponent(p.id)}`} className="party-link">{p.name}</Link></td>
                  <td data-label="Phone">{p.number}</td>
                  <td className="num" data-label="Tasks">{p.totalTasks}</td>
                  <td className="num" data-label="Billed">{money(p.totalAmount)}</td>
                  <td className="num pos" data-label="Collected">{money(p.collected)}</td>
                  <td className="num warn" data-label="Outstanding">{money(p.outstanding)}</td>
                  <td data-label="Last task">{p.lastDate ? prettyDate(p.lastDate) : '–'}</td>
                  <td className="row-actions">
                    <Link className="icon-btn" href={`/reports/${encodeURIComponent(p.id)}`} aria-label={`Open ${p.name}`}><Icon name="eye" size={18} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

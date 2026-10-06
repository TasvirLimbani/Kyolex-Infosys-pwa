'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { ROLES, labelOf } from '@/lib/constants';
import { useUser } from '@/components/UserContext';
import EmployeeForm from '@/components/EmployeeForm';
import Modal from '@/components/Modal';
import Icon from '@/components/Icon';
import { EmpStatusBadge } from '@/components/Badges';

export default function EmployeesPage() {
  const user = useUser();
  const [list, setList] = useState(null);
  const [modal, setModal] = useState(null); // { employee?: {...} }
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api('/api/employees').then((d) => setList(d.employees)).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { if (user.role === 'admin') load(); }, [load, user.role]);

  if (user.role !== 'admin') return <p className="empty">Only admins can manage employees.</p>;

  async function remove(emp) {
    if (!confirm(`Delete ${emp.name} (${emp.employeeId})?`)) return;
    try {
      await api(`/api/employees/${emp.id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="page">
      <div className="toolbar">
        <p className="muted">{list ? `${list.filter((e) => e.status === 'active').length} active of ${list.length}` : ''}</p>
        <button className="btn btn-primary add-btn" onClick={() => setModal({})}><Icon name="plus" size={18} /> Add employee</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {!list ? (
        <div className="loading">Loading employees…</div>
      ) : (
        <div className="table-wrap">
          <table className="table table-emp">
            <thead>
              <tr><th>Employee ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th className="num">Tasks</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td className="mono-id" data-label="Employee ID">{e.employeeId}</td>
                  <td className="cell-title"><strong>{e.name}</strong>{e.id === user.id && <span className="you"> (you)</span>}</td>
                  <td className="cell-wide" data-label="Email">{e.email}</td>
                  <td data-label="Role">{labelOf(ROLES, e.role)}</td>
                  <td data-label="Status"><EmpStatusBadge status={e.status} /></td>
                  <td className="num" data-label="Tasks">{e.taskCount}</td>
                  <td className="row-actions">
                    <button className="icon-btn" onClick={() => setModal({ employee: e })} aria-label={`Edit ${e.name}`}><Icon name="edit" size={18} /></button>
                    {e.id !== user.id && (
                      <button className="icon-btn danger" onClick={() => remove(e)} aria-label={`Delete ${e.name}`}><Icon name="trash" size={18} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button className="fab" onClick={() => setModal({})} aria-label="Add employee"><Icon name="plus" size={26} /></button>

      {modal && (
        <Modal title={modal.employee ? `Edit ${modal.employee.name}` : 'Add employee'} onClose={() => setModal(null)}>
          <EmployeeForm employee={modal.employee} onSaved={() => { setModal(null); load(); }} />
        </Modal>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import { ROLES, EMP_STATUSES } from '@/lib/constants';

export default function EmployeeForm({ employee, onSaved }) {
  const editing = Boolean(employee);
  const [form, setForm] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    password: '',
    employeeId: employee?.employeeId || '',
    role: employee?.role || 'employee',
    status: employee?.status || 'active',
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const d = editing
        ? await api(`/api/employees/${employee.id}`, { method: 'PUT', body: form })
        : await api('/api/employees', { method: 'POST', body: form });
      onSaved(d.employee);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <label className="field span-2">
        <span>Employee name</span>
        <input value={form.name} onChange={set('name')} required autoFocus />
      </label>
      <label className="field">
        <span>Employee ID</span>
        <input value={form.employeeId} onChange={set('employeeId')} placeholder="EMP002" required />
      </label>
      <label className="field">
        <span>Email</span>
        <input type="email" value={form.email} onChange={set('email')} required autoComplete="off" />
      </label>
      <label className="field span-2">
        <span>{editing ? 'New password (leave blank to keep current)' : 'Password'}</span>
        <div className="pw-wrap">
          <input type={show ? 'text' : 'password'} value={form.password} onChange={set('password')}
            minLength={6} required={!editing} autoComplete="new-password" />
          <button type="button" className="link-btn" onClick={() => setShow((s) => !s)}>{show ? 'Hide' : 'Show'}</button>
        </div>
      </label>
      <label className="field">
        <span>Role</span>
        <select value={form.role} onChange={set('role')}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Status</span>
        <select value={form.status} onChange={set('status')}>
          {EMP_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </label>

      {error && <p className="form-error span-2" role="alert">{error}</p>}
      <div className="form-actions span-2">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add employee'}
        </button>
      </div>
    </form>
  );
}

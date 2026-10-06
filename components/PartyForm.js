'use client';
import { useState } from 'react';
import { api } from '@/lib/client';

export default function PartyForm({ party, onSaved }) {
  const editing = Boolean(party);
  const [form, setForm] = useState({
    name: party?.name || '',
    number: party?.number || '',
    email: party?.email || '',
    address: party?.address || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const d = editing
        ? await api(`/api/parties/${party.id}`, { method: 'PUT', body: form })
        : await api('/api/parties', { method: 'POST', body: form });
      onSaved(d.party);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <label className="field span-2">
        <span>Party name</span>
        <input value={form.name} onChange={set('name')} required autoFocus />
      </label>
      <label className="field">
        <span>Phone number</span>
        <input type="tel" value={form.number} onChange={set('number')} required />
      </label>
      <label className="field">
        <span>Email (optional)</span>
        <input type="email" value={form.email} onChange={set('email')} />
      </label>
      <label className="field span-2">
        <span>Address (optional)</span>
        <textarea rows="2" value={form.address} onChange={set('address')} />
      </label>
      {error && <p className="form-error span-2" role="alert">{error}</p>}
      <div className="form-actions span-2">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add party'}
        </button>
      </div>
    </form>
  );
}

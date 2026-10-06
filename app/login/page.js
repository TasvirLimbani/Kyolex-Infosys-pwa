'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Sign in failed. Try again.');
      window.location.href = data.role === 'employee' ? '/tasks' : '/dashboard';
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-side" aria-hidden="true">
        <img className="login-logo" src="/brand/logo-light.png" alt="" />
        <ul className="login-points">
          <li><Icon name="check" size={20} /><span>Assign tasks and follow them to completion</span></li>
          <li><Icon name="phone" size={20} /><span>Call any party with one tap</span></li>
          <li><Icon name="bell" size={20} /><span>Get an alert the moment a task changes</span></li>
        </ul>
        <p className="login-tag">Every task, every party, every teammate in one place.</p>
      </section>

      <section className="login-card">
        <img className="login-logo-mobile" src="/brand/logo.png" alt="Kyolex Infosys" />
        <h1>Sign in</h1>
        <p className="muted">Use the email and password your admin gave you.</p>
        <form onSubmit={submit} className="login-form">
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
          </label>
          <label className="field">
            <span>Password</span>
            <div className="pw-wrap">
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              <button type="button" className="link-btn" onClick={() => setShow((s) => !s)}>{show ? 'Hide' : 'Show'}</button>
            </div>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  );
}

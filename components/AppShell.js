'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { ROLES, labelOf } from '@/lib/constants';
import { UserContext } from './UserContext';
import NotificationBell, { currentEndpoint } from './NotificationBell';
import Icon from './Icon';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: 'grid', roles: ['admin', 'manager'] },
  { href: '/tasks', label: 'Tasks', icon: 'check', roles: ['admin', 'manager', 'employee'] },
  { href: '/employees', label: 'Employees', icon: 'users', roles: ['admin'] },
  { href: '/reports', label: 'Reports', icon: 'report', roles: ['admin', 'manager'] },
];
const allowed = (user, pathname) => NAV.some((n) => pathname.startsWith(n.href) && n.roles.includes(user.role));

export default function AppShell({ children }) {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    api('/api/auth/me').then((d) => setUser(d.user)).catch(() => {});
  }, []);

  async function logout() {
    // this device stops receiving the signed-out user's alerts
    const endpoint = await currentEndpoint().catch(() => null);
    if (endpoint) await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint }) }).catch(() => {});
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  // A page this role cannot open (e.g. an employee on /dashboard) sends them to Tasks.
  const blocked = user && !allowed(user, pathname);
  useEffect(() => {
    if (blocked) router.replace('/tasks');
  }, [blocked, router]);

  if (!user || blocked) return <div className="splash"><img className="splash-mark" src="/brand/mark.png" alt="Kyolex Infosys" /></div>;

  const items = NAV.filter((n) => n.roles.includes(user.role));
  const current = items.find((n) => pathname.startsWith(n.href));
  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <UserContext.Provider value={user}>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand"><img className="brand-mark" src="/brand/mark.png" alt="" /><span className="brand-name"><b>Kyolex</b> Infosys</span></div>
          <nav className="side-nav">
            {items.map((n) => (
              <Link key={n.href} href={n.href} className={pathname.startsWith(n.href) ? 'active' : ''}>
                <Icon name={n.icon} /> {n.label}
              </Link>
            ))}
          </nav>
          <div className="side-user">
            <span className="avatar">{initials}</span>
            <span className="side-user-text">
              <strong>{user.name}</strong>
              <small>{labelOf(ROLES, user.role)}, {user.employeeId}</small>
            </span>
            <button className="icon-btn" onClick={logout} aria-label="Sign out" title="Sign out"><Icon name="logout" /></button>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <h1 className="page-title"><img className="brand-mark mobile-only" src="/brand/mark.png" alt="Kyolex Infosys" />{current?.label || 'Kyolex Infosys'}</h1>
            <div className="topbar-actions">
              <NotificationBell />
              <button className="icon-btn mobile-only" onClick={logout} aria-label="Sign out"><Icon name="logout" /></button>
            </div>
          </header>
          <main className="content">{children}</main>
        </div>

        <nav className="bottom-nav">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className={pathname.startsWith(n.href) ? 'active' : ''}>
              <Icon name={n.icon} size={22} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </UserContext.Provider>
  );
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import Icon from './Icon';

const supported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function keyBytes(base64) {
  const raw = atob((base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// The push subscription of this device, if any. Used on sign out.
export async function currentEndpoint() {
  if (!supported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  return sub ? sub.endpoint : null;
}

// Bell in the top bar: turns on phone alerts for this device and keeps its subscription registered.
export default function NotificationBell() {
  const [perm, setPerm] = useState('granted'); // granted | default | denied | unsupported
  const [note, setNote] = useState('');

  const subscribe = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready;
    const { publicKey } = await api('/api/push');
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
    await api('/api/push', { method: 'POST', body: { subscription: sub.toJSON() } });
  }, []);

  useEffect(() => {
    if (!supported()) return setPerm('unsupported');
    setPerm(Notification.permission);
    if (Notification.permission === 'granted') subscribe().catch(() => {});
  }, [subscribe]);

  async function onClick() {
    if (perm === 'unsupported') return setNote('This browser does not support alerts. On iPhone, add the app to the Home Screen first.');
    if (perm === 'denied') return setNote('Alerts are blocked. Allow notifications for this site in your browser settings.');
    try {
      const p = perm === 'granted' ? perm : await Notification.requestPermission();
      setPerm(p);
      if (p !== 'granted') return;
      await subscribe();
      setNote('Alerts are on for this device.');
    } catch (e) {
      setNote(`Could not turn on alerts: ${e.message}`);
    }
  }

  return (
    <div className="bell">
      <button className="icon-btn" onClick={onClick} onBlur={() => setNote('')}
        aria-label={perm === 'granted' ? 'Task alerts are on' : 'Turn on task alerts'} title={perm === 'granted' ? 'Task alerts are on' : 'Turn on task alerts'}>
        <Icon name="bell" />
        {perm !== 'granted' && <span className="bell-count">!</span>}
      </button>
      {note && <div className="bell-panel"><p className="bell-note" role="status">{note}</p></div>}
    </div>
  );
}

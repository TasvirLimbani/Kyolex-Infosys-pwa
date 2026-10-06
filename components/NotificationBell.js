'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useUser } from './UserContext';
import Icon from './Icon';

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

// OneSignal's web SDK, loaded and started once per page load.
let sdk;
function oneSignal() {
  if (!sdk) {
    sdk = new Promise((resolve, reject) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push((OneSignal) =>
        OneSignal.init({
          appId: '07f7620e-d523-4542-9928-3de7a51aadd6',
          // worker: /OneSignalSDKWorker.js, OneSignal's default, which also loads the app's /sw.js
          allowLocalhostAsSecureOrigin: true,
        }).then(() => resolve(OneSignal), reject)
      );
      const s = document.createElement('script');
      s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      s.defer = true;
      s.onerror = () => reject(new Error('OneSignal could not be loaded. Check the connection or an ad blocker.'));
      document.head.appendChild(s);
    });
  }
  return sdk;
}

// Sign out: this device stops receiving the signed-out user's alerts.
export async function alertsSignOut() {
  if (sdk) await sdk.then((os) => os.logout()).catch(() => {});
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Ties this device to the employee in OneSignal and waits until the device has its push subscription.
async function register(os, user) {
  const id = String(user.employeeId || '').toLowerCase();
  if (os.User.externalId !== id) await os.login(id);
  os.User.addTags({ role: user.role, employee: id });
  await os.User.PushSubscription.optIn();
  for (let i = 0; i < 20 && !os.User.PushSubscription.id; i++) await wait(500);
}

// Bell in the top bar: turns on phone alerts for this device and ties it to the signed-in employee.
export default function NotificationBell() {
  const user = useUser();
  const [perm, setPerm] = useState('granted'); // granted | default | denied | unsupported | off
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!APP_ID) return setPerm('off');
    let live = true;
    oneSignal()
      .then(async (os) => {
        if (!os.Notifications.isPushSupported()) return live && setPerm('unsupported');
        if (os.Notifications.permission) await register(os, user);
        if (live) setPerm(os.Notifications.permission ? 'granted' : os.Notifications.permissionNative);
      })
      .catch(() => live && setPerm('default'));
    return () => { live = false; };
  }, [user]);

  async function onClick() {
    if (perm === 'off') return setNote('Alerts are not set up yet: the OneSignal app ID is missing.');
    if (perm === 'unsupported') {
      return setNote(window.isSecureContext
        ? 'This browser does not support alerts. On iPhone, add the app to the Home Screen first.'
        : 'Alerts need a secure (https) address. Open the app on its https link.');
    }
    if (perm === 'denied') return setNote('Alerts are blocked. Allow notifications for this app in your phone settings.');
    try {
      const os = await oneSignal();
      if (!os.Notifications.permission) await os.Notifications.requestPermission();
      if (!os.Notifications.permission) return setPerm(os.Notifications.permissionNative);
      setPerm('granted');
      setNote('Sending a test alert…');
      await register(os, user);
      // OneSignal needs a few seconds to link a new device to the employee: try again while it says "unknown".
      let sent;
      for (let i = 0; i < 6; i++) {
        sent = await api('/api/push', { method: 'POST' });
        if (sent.ok || !sent.pending) break;
        await wait(3000);
      }
      setNote(sent.ok ? 'Alerts are on. A test alert was sent to this device.' : `Alerts could not be delivered. ${sent.error}`);
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

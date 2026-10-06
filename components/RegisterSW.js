'use client';
import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // One worker for the whole app: OneSignal's push code plus the offline code in /sw.js.
    navigator.serviceWorker.register('/OneSignalSDKWorker.js', { scope: '/' }).catch(() => {});
  }, []);
  return null;
}

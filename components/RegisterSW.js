'use client';
import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // The worker is needed for push alerts in dev too; "?dev=1" switches its caching off there,
    // because a cache would serve stale chunks.
    const url = process.env.NODE_ENV === 'production' ? '/sw.js' : '/sw.js?dev=1';
    navigator.serviceWorker.register(url, { scope: '/' }).catch(() => {});
  }, []);
  return null;
}

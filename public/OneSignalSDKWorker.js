// The app's one service worker, at the name and place OneSignal looks for by default.
// It runs OneSignal's push code and the app's own offline code (/sw.js) together.
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (e) {
  // OneSignal unreachable (offline, blocked): the app still works, only alerts are off
}
importScripts('/sw.js');

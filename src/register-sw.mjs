export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Desactivado temporalmente para desarrollo - el SW interfiere con los módulos
// registerServiceWorker();

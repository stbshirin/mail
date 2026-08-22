/**
 * PWA Service Worker Registration Helper
 * Safely registers sw.js in production/supported environments with error handling
 */
export function registerServiceWorker() {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Do not register inside sandboxed iframes (e.g. preview windows) to prevent security errors
    if (window.self !== window.top) {
      return;
    }

    // Only register on HTTPS or localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSecure = window.location.protocol === 'https:' || isLocalhost;

    if (!isSecure) {
      return;
    }

    window.addEventListener('load', () => {
      try {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            // Check for updates periodically
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('[PWA] New content is available; will update on next session.');
                    } else {
                      console.log('[PWA] Content is cached for offline use.');
                    }
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.warn('[PWA] Service worker registration failed gracefully:', error);
          });
      } catch (err) {
        console.warn('[PWA] Service worker initialization caught error:', err);
      }
    });
  } catch (e) {
    console.warn('[PWA] Service worker check caught error:', e);
  }
}

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope & typeof globalThis

// SyncEvent is not in TS types yet — define it manually
interface SyncEvent extends ExtendableEvent {
  readonly tag: string
  readonly lastChance: boolean
}

declare global {
  interface ServiceWorkerGlobalScopeEventMap {
    'sync': SyncEvent
  }
}

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { replayPendingRequests } from './lib/syncManager'

// ✅ Controlled activation — skip waiting on install only, then claim clients
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // ✅ Take control of all open tabs immediately after activation
      clientsClaim(),
      // ✅ Purge old caches on every new SW activation
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => !['api-cache-v2'].includes(key))
            .map((key) => caches.delete(key))
        )
      ),
    ])
  )
})

// Precache all assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)

// ✅ Auth endpoints — NEVER cache, always hit the network directly
registerRoute(
  ({ url }) =>
    url.href.startsWith(import.meta.env.VITE_API_URL) &&
    url.pathname.includes('/auth/'),
  new NetworkOnly()
)

// ✅ All other API routes — NetworkFirst with cache fallback
registerRoute(
  ({ url }) =>
    url.href.startsWith(import.meta.env.VITE_API_URL) &&
    !url.pathname.includes('/auth/'),
  new NetworkFirst({
    cacheName: 'api-cache-v2',
    networkTimeoutSeconds: 10,
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => request.url,
      },
    ],
  })
)

// Background sync
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(replayPendingRequests())
  }
})

// Push notifications
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? { title: 'New message', body: '' }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon/pwa-192.png',
    })
  )
})
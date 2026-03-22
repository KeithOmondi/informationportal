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

import { clientsClaim, skipWaiting } from 'workbox-core' // 👈 added skipWaiting
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { replayPendingRequests } from './lib/syncManager'

skipWaiting()  // 👈 skip waiting phase — activate immediately
clientsClaim() // 👈 take control of all open tabs

// Precache all assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)

// Runtime caching for your API
registerRoute(
  ({ url }) => url.href.startsWith(import.meta.env.VITE_API_URL),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => request.url,
      }
    ]
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
      icon: '/icon/pwa-192.png'
    })
  )
})
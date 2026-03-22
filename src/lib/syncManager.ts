// Extend ServiceWorkerRegistration to include Background Sync API
interface SyncManager {
  register(tag: string): Promise<void>
}

declare global {
  interface ServiceWorkerRegistration {
    readonly sync: SyncManager
  }
  interface Window {
    SyncManager: SyncManager
  }
}

import { savePendingRequest, getPendingRequests, deletePendingRequest } from './syncDB'

export async function syncFetch(
  url: string,
  options: RequestInit
): Promise<Response | null> {
  try {
    const response = await fetch(url, options)
    return response
  } catch {
    await savePendingRequest({
      url,
      method: options.method || 'POST',
      body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body),
      headers: (options.headers as Record<string, string>) || {}
    })

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready
      await reg.sync.register('sync-pending-requests')
    }

    return null
  }
}

export async function replayPendingRequests() {
  const pending = await getPendingRequests()

  for (const req of pending) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        body: req.body,
        headers: req.headers
      })

      if (response.ok) {
        await deletePendingRequest(req.id)
      }
    } catch {
      console.warn('Still offline, keeping request in queue:', req.url)
    }
  }
}
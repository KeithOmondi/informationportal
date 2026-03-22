import { api } from "../api/axios"


const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Convert VAPID key to the format the browser expects
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> { // 👈 narrowed type
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length) // 👈 explicit ArrayBuffer
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Request permission and subscribe
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    // 1. Ask for notification permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return null
    }

    // 2. Get the service worker registration
    const reg = await navigator.serviceWorker.ready

    // 3. Subscribe to push
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    // 4. Send subscription to your backend
    await sendSubscriptionToServer(subscription)

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push:', error)
    return null
  }
}

// Send the subscription object to your backend
async function sendSubscriptionToServer(subscription: PushSubscription) {
  await api.post('/notifications/subscribe', subscription.toJSON())
}
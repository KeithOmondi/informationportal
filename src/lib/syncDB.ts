import { openDB } from 'idb'

const DB_NAME = 'hc-portal-sync'
const STORE_NAME = 'pending-requests'

export const getSyncDB = () =>
  openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        })
      }
    }
  })

// Save a failed request to IndexedDB
export async function savePendingRequest(request: {
  url: string
  method: string
  body: string
  headers: Record<string, string>
}) {
  const db = await getSyncDB()
  await db.add(STORE_NAME, {
    ...request,
    timestamp: Date.now()
  })
}

// Get all pending requests
export async function getPendingRequests() {
  const db = await getSyncDB()
  return db.getAll(STORE_NAME)
}

// Delete a request after it's been successfully synced
export async function deletePendingRequest(id: number) {
  const db = await getSyncDB()
  await db.delete(STORE_NAME, id)
}
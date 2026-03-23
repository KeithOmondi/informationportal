import type { store as StoreType } from './store'

type AppStore = typeof StoreType

let _store: AppStore

export const setStoreReference = (s: AppStore) => {
  _store = s
}

export const getStore = (): AppStore => _store
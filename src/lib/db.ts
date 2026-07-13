// 本地优先存储 — 遵循 docs/specs/03-本地优先存储.md
// 库名 ciyuan-muse；stores: projects / generations / styles_custom / settings
// 全部存于浏览器，不上云、不登录（即"零后端"本身，非外部后端）。

export const DB_NAME = 'ciyuan-muse'
export const DB_VERSION = 1

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('generations')) {
        db.createObjectStore('generations', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('styles_custom')) {
        db.createObjectStore('styles_custom', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode)
        const req = fn(t.objectStore(store))
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error)
      }),
  )
}

export const idb = {
  getAll: <T>(store: string) => run<T[]>(store, 'readonly', (s) => s.getAll()),
  put: <T>(store: string, value: T) =>
    run<IDBValidKey>(store, 'readwrite', (s) => s.put(value as unknown as object)),
  del: (store: string, key: string) => run<undefined>(store, 'readwrite', (s) => s.delete(key)),
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const rec = await run<{ key: string; value: T } | undefined>('settings', 'readonly', (s) => s.get(key))
  return rec?.value
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await run('settings', 'readwrite', (s) => s.put({ key, value }))
}

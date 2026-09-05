/**
 * Resilient IndexedDB Connection and Transaction Manager
 * Prevents race conditions, handles onversionchange/onclose, resolves blocked events,
 * and retries aborted transactions automatically.
 */

export interface IDBConfig {
  dbName: string;
  version: number;
  onUpgrade: (db: IDBDatabase, oldVersion: number, newVersion: number | null) => void;
}

export class ResilientIndexedDB {
  private static connections: Map<string, { dbPromise: Promise<IDBDatabase> | null; dbInstance: IDBDatabase | null }> = new Map();
  private static writeMutexMap: Map<string, Promise<any>> = new Map();

  /**
   * Acquire a safe, managed IDBDatabase instance
   */
  public static async getDB(config: IDBConfig): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      throw new Error('IndexedDB is not supported in this environment');
    }

    let conn = this.connections.get(config.dbName);
    if (!conn) {
      conn = { dbPromise: null, dbInstance: null };
      this.connections.set(config.dbName, conn);
    }

    if (conn.dbInstance) {
      try {
        // Quick health check to see if database connection is still open
        if (conn.dbInstance.objectStoreNames) {
          return conn.dbInstance;
        }
      } catch {
        conn.dbInstance = null;
        conn.dbPromise = null;
      }
    }

    if (!conn.dbPromise) {
      conn.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        let isSettled = false;
        const request = window.indexedDB.open(config.dbName, config.version);

        request.onblocked = () => {
          console.warn(`[IDB] Database ${config.dbName} open is blocked by other open connections.`);
        };

        request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
          const db = request.result;
          config.onUpgrade(db, e.oldVersion, e.newVersion);
        };

        request.onsuccess = () => {
          if (isSettled) return;
          isSettled = true;
          const db = request.result;

          // Handle unexpected closes or version changes from other tabs
          db.onversionchange = () => {
            console.warn(`[IDB] Database ${config.dbName} version changed in another context. Closing connection gracefully.`);
            try {
              db.close();
            } catch {
              // ignore
            }
            conn!.dbInstance = null;
            conn!.dbPromise = null;
          };

          db.onclose = () => {
            conn!.dbInstance = null;
            conn!.dbPromise = null;
          };

          conn!.dbInstance = db;
          resolve(db);
        };

        request.onerror = () => {
          if (isSettled) return;
          isSettled = true;
          conn!.dbPromise = null;
          conn!.dbInstance = null;
          reject(request.error || new Error(`Failed to open IndexedDB ${config.dbName}`));
        };
      }).catch((err) => {
        conn!.dbPromise = null;
        conn!.dbInstance = null;
        throw err;
      });
    }

    return conn.dbPromise;
  }

  /**
   * Execute a sequential, mutex-protected write transaction to avoid concurrent write collisions
   */
  public static async executeWrite<T>(
    config: IDBConfig,
    storeNames: string | string[],
    executor: (tx: IDBTransaction, stores: Record<string, IDBObjectStore>) => Promise<T>,
    maxRetries = 2
  ): Promise<T> {
    const queueKey = `${config.dbName}_${Array.isArray(storeNames) ? storeNames.join('_') : storeNames}`;
    const previousTask = this.writeMutexMap.get(queueKey) || Promise.resolve();

    let currentAttempt = 0;

    const runWrite = async (): Promise<T> => {
      while (currentAttempt <= maxRetries) {
        try {
          const db = await this.getDB(config);
          const storesArray = Array.isArray(storeNames) ? storeNames : [storeNames];

          return await new Promise<T>((resolve, reject) => {
            try {
              const tx = db.transaction(storesArray, 'readwrite');
              const stores: Record<string, IDBObjectStore> = {};
              for (const name of storesArray) {
                stores[name] = tx.objectStore(name);
              }

              let resultPromise: Promise<T> | null = null;
              try {
                resultPromise = executor(tx, stores);
              } catch (execErr) {
                reject(execErr);
                return;
              }

              tx.oncomplete = async () => {
                try {
                  const res = resultPromise ? await resultPromise : (undefined as unknown as T);
                  resolve(res);
                } catch (e) {
                  reject(e);
                }
              };

              tx.onerror = () => reject(tx.error || new Error('Transaction error'));
              tx.onabort = () => reject(new Error('Transaction aborted'));
            } catch (txCreateErr) {
              reject(txCreateErr);
            }
          });
        } catch (err: any) {
          currentAttempt++;
          if (currentAttempt > maxRetries) {
            throw err;
          }
          // Exponential backoff
          await new Promise((r) => setTimeout(r, 50 * currentAttempt));
        }
      }
      throw new Error('Write operation exceeded max retries');
    };

    // Chain to mutex queue
    const taskPromise = previousTask.then(runWrite, runWrite);
    this.writeMutexMap.set(queueKey, taskPromise.catch(() => {}));

    return taskPromise;
  }

  /**
   * Execute a read transaction safely
   */
  public static async executeRead<T>(
    config: IDBConfig,
    storeName: string,
    executor: (store: IDBObjectStore) => Promise<T>
  ): Promise<T> {
    const db = await this.getDB(config);
    return new Promise<T>((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);

        executor(store)
          .then((res) => resolve(res))
          .catch((err) => reject(err));

        tx.onerror = () => reject(tx.error || new Error('Read transaction error'));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Close a database connection completely
   */
  public static close(dbName: string): void {
    const conn = this.connections.get(dbName);
    if (conn?.dbInstance) {
      try {
        conn.dbInstance.close();
      } catch {
        // ignore
      }
    }
    this.connections.delete(dbName);
  }
}

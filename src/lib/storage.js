const DB_NAME = "whisperbox-secure-store";
const DB_VERSION = 1;
const KEY_STORE = "keyMaterial";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE, { keyPath: "userId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function write(storeName, value) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  }).finally(() => db.close());
}

async function read(storeName, key) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(key);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

async function remove(storeName, key) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  }).finally(() => db.close());
}

export function saveWrappedKeyMaterial(user) {
  return write(KEY_STORE, {
    userId: user.id,
    publicKey: user.public_key,
    wrappedPrivateKey: user.wrapped_private_key,
    pbkdf2Salt: user.pbkdf2_salt,
    savedAt: new Date().toISOString(),
  });
}

export function getWrappedKeyMaterial(userId) {
  return read(KEY_STORE, userId);
}

export function deleteWrappedKeyMaterial(userId) {
  return remove(KEY_STORE, userId);
}

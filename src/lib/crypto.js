import { arrayBufferToBase64, base64ToArrayBuffer } from "./base64";

const RSA_PARAMS = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

const PBKDF2_ITERATIONS = 310000;
const PRIVATE_KEY_WRAP_ALG = "PBKDF2-AES-GCM-PKCS8";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function deriveKey(password, salt, algorithm, usages) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    algorithm,
    false,
    usages,
  );
}

function encodeWrappedPrivateKey({ ciphertext, iv }) {
  return arrayBufferToBase64(
    encoder.encode(
      JSON.stringify({
        alg: PRIVATE_KEY_WRAP_ALG,
        ciphertext: arrayBufferToBase64(ciphertext),
        iv: arrayBufferToBase64(iv),
      }),
    ),
  );
}

function decodeWrappedPrivateKey(value) {
  const decoded = decoder.decode(base64ToArrayBuffer(value));
  return JSON.parse(decoded);
}

async function encryptPrivateKey(password, salt, privateKey) {
  const wrappingKey = await deriveKey(
    password,
    salt,
    { name: "AES-GCM", length: 256 },
    ["encrypt", "decrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const exportedPrivateKey = await crypto.subtle.exportKey("pkcs8", privateKey);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    exportedPrivateKey,
  );

  return encodeWrappedPrivateKey({ ciphertext, iv });
}

async function decryptPrivateKey(password, wrappedPrivateKey, pbkdf2Salt) {
  const salt = new Uint8Array(base64ToArrayBuffer(pbkdf2Salt));
  const wrapped = decodeWrappedPrivateKey(wrappedPrivateKey);

  if (wrapped.alg !== PRIVATE_KEY_WRAP_ALG) {
    throw new Error("Unsupported private key wrapping format.");
  }

  const wrappingKey = await deriveKey(
    password,
    salt,
    { name: "AES-GCM", length: 256 },
    ["encrypt", "decrypt"],
  );
  const privateKeyBytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(base64ToArrayBuffer(wrapped.iv)) },
    wrappingKey,
    base64ToArrayBuffer(wrapped.ciphertext),
  );

  return crypto.subtle.importKey("pkcs8", privateKeyBytes, RSA_PARAMS, false, [
    "decrypt",
  ]);
}

async function unwrapLegacyAesKwPrivateKey(password, wrappedPrivateKey, pbkdf2Salt) {
  const salt = new Uint8Array(base64ToArrayBuffer(pbkdf2Salt));
  const wrappingKey = await deriveKey(
    password,
    salt,
    { name: "AES-KW", length: 256 },
    ["wrapKey", "unwrapKey"],
  );

  return crypto.subtle.unwrapKey(
    "pkcs8",
    base64ToArrayBuffer(wrappedPrivateKey),
    wrappingKey,
    "AES-KW",
    RSA_PARAMS,
    false,
    ["decrypt"],
  );
}

export async function createRegistrationKeys(password) {
  const keyPair = await crypto.subtle.generateKey(RSA_PARAMS, true, [
    "encrypt",
    "decrypt",
  ]);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wrappedPrivateKeyBase64 = await encryptPrivateKey(
    password,
    salt,
    keyPair.privateKey,
  );
  const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);

  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicKeyBase64: arrayBufferToBase64(publicKey),
    wrappedPrivateKeyBase64,
    saltBase64: arrayBufferToBase64(salt),
  };
}

export async function unlockPrivateKey(password, wrappedPrivateKey, pbkdf2Salt) {
  try {
    return await decryptPrivateKey(password, wrappedPrivateKey, pbkdf2Salt);
  } catch (caught) {
    if (caught instanceof SyntaxError) {
      try {
        return await unwrapLegacyAesKwPrivateKey(
          password,
          wrappedPrivateKey,
          pbkdf2Salt,
        );
      } catch {
        throw new Error(
          "Could not unlock the private key. Check the password and key format.",
        );
      }
    }

    throw caught;
  }
}

export async function importPublicKey(publicKeyBase64) {
  return crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(publicKeyBase64),
    RSA_PARAMS,
    true,
    ["encrypt"],
  );
}

export async function encryptMessage(plaintext, recipientPublicKey, ownPublicKey) {
  const messageKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    messageKey,
    encoded,
  );
  const rawMessageKey = await crypto.subtle.exportKey("raw", messageKey);
  const encryptedKey = await crypto.subtle.encrypt(
    RSA_PARAMS,
    recipientPublicKey,
    rawMessageKey,
  );
  const encryptedKeyForSelf = await crypto.subtle.encrypt(
    RSA_PARAMS,
    ownPublicKey,
    rawMessageKey,
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    encryptedKey: arrayBufferToBase64(encryptedKey),
    encryptedKeyForSelf: arrayBufferToBase64(encryptedKeyForSelf),
  };
}

export async function decryptMessage(payload, privateKey, shouldUseSelfKey) {
  const wrappedKey = shouldUseSelfKey
    ? payload.encryptedKeyForSelf
    : payload.encryptedKey;
  const rawMessageKey = await crypto.subtle.decrypt(
    RSA_PARAMS,
    privateKey,
    base64ToArrayBuffer(wrappedKey),
  );
  const messageKey = await crypto.subtle.importKey(
    "raw",
    rawMessageKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(base64ToArrayBuffer(payload.iv)) },
    messageKey,
    base64ToArrayBuffer(payload.ciphertext),
  );

  return decoder.decode(plaintext);
}

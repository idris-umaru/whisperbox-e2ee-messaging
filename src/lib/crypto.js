import { arrayBufferToBase64, base64ToArrayBuffer } from "./base64";

const RSA_PARAMS = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

const PBKDF2_ITERATIONS = 310000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function deriveWrappingKey(password, salt) {
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
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"],
  );
}

export async function createRegistrationKeys(password) {
  const keyPair = await crypto.subtle.generateKey(RSA_PARAMS, true, [
    "encrypt",
    "decrypt",
  ]);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wrappingKey = await deriveWrappingKey(password, salt);
  const wrappedPrivateKey = await crypto.subtle.wrapKey(
    "pkcs8",
    keyPair.privateKey,
    wrappingKey,
    "AES-KW",
  );
  const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);

  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicKeyBase64: arrayBufferToBase64(publicKey),
    wrappedPrivateKeyBase64: arrayBufferToBase64(wrappedPrivateKey),
    saltBase64: arrayBufferToBase64(salt),
  };
}

export async function unlockPrivateKey(password, wrappedPrivateKey, pbkdf2Salt) {
  const wrappingKey = await deriveWrappingKey(
    password,
    new Uint8Array(base64ToArrayBuffer(pbkdf2Salt)),
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

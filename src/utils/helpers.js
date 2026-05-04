import { MAX_MESSAGE_LENGTH } from "../constants";
import {
  decryptMessage,
  encryptMessage,
  importPublicKey,
} from "../lib/crypto";

export function getPeerId(peer) {
  return peer?.user_id ?? peer?.id ?? null;
}

export function getInitials(name = "?") {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function isValidMessageText(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= MAX_MESSAGE_LENGTH
  );
}

export function normalizeSocketMessage(event) {
  try {
    const frame = JSON.parse(event.data);

    if (frame.type === "message.receive") {
      return frame.payload ?? frame.message ?? null;
    }

    if (frame.event === "message.receive") {
      return frame.payload ?? frame.data ?? null;
    }

    if (frame.id && frame.payload) {
      return frame;
    }
  } catch {
    return null;
  }

  return null;
}

export async function createEncryptedPayload(
  text,
  recipientPublicKeyBase64,
  ownPublicKeyBase64,
) {
  const [recipientPublicKey, ownPublicKey] = await Promise.all([
    importPublicKey(recipientPublicKeyBase64),
    importPublicKey(ownPublicKeyBase64),
  ]);

  return encryptMessage(text.trim(), recipientPublicKey, ownPublicKey);
}

export async function decryptServerMessage(message, currentUserId, privateKey) {
  try {
    const shouldUseSelfKey = message.from_user_id === currentUserId;
    const plaintext = await decryptMessage(message.payload, privateKey, shouldUseSelfKey);

    return {
      ...message,
      plaintext,
      failed: false,
    };
  } catch {
    return {
      ...message,
      plaintext: "Unable to decrypt this message",
      failed: true,
    };
  }
}

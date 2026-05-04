# WhisperBox E2EE Messaging Client

Secure React client for the WhisperBox backend at `https://whisperbox.koyeb.app`.
Plaintext is encrypted in the browser before send and decrypted only after receipt.

## Project Structure

```text
e2ee-messenger/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── common/
│   │   └── layout/
│   ├── hooks/
│   ├── lib/
│   │   ├── api.js
│   │   ├── crypto.js
│   │   └── storage.js
│   ├── pages/
│   ├── store/
│   ├── utils/
│   ├── App.jsx
│   ├── constants.js
│   └── main.jsx
├── .env.example
├── vite.config.js
├── package.json
└── README.md
```

## Run Locally

```bash
npm install
npm run dev
```

The app uses HTTPS-only backend and WebSocket endpoints:

- API: `https://whisperbox.koyeb.app`
- WebSocket: `wss://whisperbox.koyeb.app/ws?token=<access_token>`

## Architecture

```text
Browser client
  |
  | 1. Generate RSA-OAEP keypair locally
  | 2. Encrypt private key with AES-GCM from password/PBKDF2
  v
WhisperBox API
  - stores public_key
  - stores wrapped_private_key
  - stores pbkdf2_salt
  - stores encrypted message payloads only

Browser client A                         Browser client B
  |                                               |
  | AES-GCM encrypt plaintext                     |
  | RSA-OAEP encrypt AES key for B and self       |
  +---------------- ciphertext ------------------>|
                                                  | RSA-OAEP unwrap AES key
                                                  | AES-GCM decrypt plaintext
```

## Encryption Flow

1. Registration generates an extractable RSA-OAEP 2048-bit keypair in Web Crypto.
2. A random 128-bit PBKDF2 salt is generated locally.
3. PBKDF2 derives an AES-GCM 256-bit wrapping key from the user's password.
4. The RSA private key is exported as PKCS#8, encrypted with AES-GCM, and sent to the server only as encrypted key material.
5. Each outgoing message creates a fresh AES-GCM 256-bit content key and 96-bit IV.
6. Message plaintext is AES-GCM encrypted in the browser.
7. The AES key is RSA-OAEP encrypted for the recipient and again for the sender.
8. The server stores only `ciphertext`, `iv`, `encryptedKey`, and `encryptedKeyForSelf`.

## Key Management

- Public keys are uploaded to the backend and fetched before sending.
- Raw private keys never leave the browser.
- Unwrapped private keys are kept in memory only for the current app session.
- Wrapped private key metadata is cached in IndexedDB through `src/lib/storage.js`.
- Access and refresh tokens are stored in `sessionStorage`, not `localStorage`.
- Reloading the page requires sign-in again to restore crypto state from the password.

## Security Trade-Offs

- The backend can authenticate users and route ciphertext, but cannot decrypt messages.
- This implementation prioritizes practical E2EE over forward secrecy. Long-term RSA keys protect message keys.
- Refresh tokens are kept in browser session storage for usability; a stricter build could keep them in memory only.
- Password strength remains important because wrapped private keys are recoverable only through PBKDF2-derived keys.
- The UI validates message length and empty sends, while the backend remains the authority for auth and user validation.

## Known Limitations

- Forward secrecy is not implemented; compromise of the RSA private key could expose historical AES keys.
- Replay protection is left to server message IDs and timestamps, not a dedicated signed nonce protocol.
- The app does not persist decrypted history locally.
- WebSocket acknowledgement shape is backend-dependent, so the client shows optimistic sent messages when using realtime send.

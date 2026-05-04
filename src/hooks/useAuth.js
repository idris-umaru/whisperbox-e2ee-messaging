import { useCallback, useState } from "react";
import {
  api,
  clearSessionTokens,
  readSessionTokens,
  saveSessionTokens,
} from "../lib/api";
import { createRegistrationKeys, unlockPrivateKey } from "../lib/crypto";
import { saveWrappedKeyMaterial } from "../lib/storage";
import { useInterval } from "./useInterval";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [notice, setNotice] = useState("");

  const authenticate = useCallback(async ({ user, privateKey, tokens }) => {
    saveSessionTokens(tokens);
    await saveWrappedKeyMaterial(user);
    setSession({ user, privateKey });
    setNotice("");
  }, []);

  const register = useCallback(
    async ({ displayName, password, username }) => {
      const keys = await createRegistrationKeys(password);
      const auth = await api.register({
        username: username.trim(),
        display_name: displayName.trim(),
        password,
        public_key: keys.publicKeyBase64,
        wrapped_private_key: keys.wrappedPrivateKeyBase64,
        pbkdf2_salt: keys.saltBase64,
      });

      await authenticate({
        user: auth.user,
        privateKey: keys.privateKey,
        tokens: auth,
      });
    },
    [authenticate],
  );

  const login = useCallback(
    async ({ password, username }) => {
      const auth = await api.login({
        username: username.trim(),
        password,
      });
      const privateKey = await unlockPrivateKey(
        password,
        auth.user.wrapped_private_key,
        auth.user.pbkdf2_salt,
      );

      await authenticate({
        user: auth.user,
        privateKey,
        tokens: auth,
      });
    },
    [authenticate],
  );

  const logout = useCallback(async () => {
    const { refreshToken } = readSessionTokens();

    try {
      if (refreshToken) {
        await api.logout(refreshToken);
      }
    } catch {
      // Local logout still clears volatile crypto state.
    }

    clearSessionTokens();
    setSession(null);
  }, []);

  useInterval(async () => {
    const { refreshToken } = readSessionTokens();

    if (!session || !refreshToken) {
      return;
    }

    try {
      const next = await api.refresh(refreshToken);
      saveSessionTokens(next);
    } catch {
      setNotice("Session expired. Please sign in again.");
      clearSessionTokens();
      setSession(null);
    }
  }, session ? 12 * 60 * 1000 : null);

  return {
    login,
    logout,
    notice,
    register,
    session,
  };
}

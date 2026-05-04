export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://whisperbox.koyeb.app";

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

export const ACCESS_TOKEN_KEY = "whisperbox.accessToken";
export const REFRESH_TOKEN_KEY = "whisperbox.refreshToken";
export const LAST_USERNAME_KEY = "whisperbox.lastUsername";

export const MAX_MESSAGE_LENGTH = 4000;

import { ACCESS_TOKEN_KEY, API_BASE_URL, REFRESH_TOKEN_KEY } from "../constants";

function getStoredAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveSessionTokens({ access_token, refresh_token }) {
  if (access_token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  }

  if (refresh_token) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  }
}

export function readSessionTokens() {
  return {
    accessToken: sessionStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: sessionStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function clearSessionTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(", ")
      : detail || data?.message || response.statusText;
    throw new Error(message);
  }

  return data;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const accessToken = getStoredAccessToken();

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return parseResponse(response);
}

export const api = {
  register(payload) {
    return request("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload),
    });
  },
  login(payload) {
    return request("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload),
    });
  },
  me() {
    return request("/auth/me");
  },
  refresh(refreshToken) {
    return request("/auth/refresh", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
  logout(refreshToken) {
    return request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
  searchUsers(query) {
    return request(`/users/search?q=${encodeURIComponent(query)}`);
  },
  getPublicKey(userId) {
    return request(`/users/${userId}/public-key`);
  },
  getConversations() {
    return request("/conversations");
  },
  getMessages(userId, before) {
    const params = new URLSearchParams({ limit: "50" });

    if (before) {
      params.set("before", before);
    }

    return request(`/conversations/${userId}/messages?${params.toString()}`);
  },
  sendMessage(to, payload) {
    return request("/messages", {
      method: "POST",
      body: JSON.stringify({ to, payload }),
    });
  },
};

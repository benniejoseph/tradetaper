type PublicAuthHintState = "auth" | "anon";

type PublicAuthHintPayload = {
  state: PublicAuthHintState;
  expiresAt: number;
};

const PUBLIC_AUTH_HINT_STORAGE_KEY = "tt_public_auth_hint_v1";
const AUTH_HINT_TTL_MS = 30 * 60 * 1000;
const ANON_HINT_TTL_MS = 5 * 60 * 1000;

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

function readHintPayload(): PublicAuthHintPayload | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(PUBLIC_AUTH_HINT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PublicAuthHintPayload;
    if (
      (parsed.state !== "auth" && parsed.state !== "anon") ||
      !Number.isFinite(parsed.expiresAt)
    ) {
      storage.removeItem(PUBLIC_AUTH_HINT_STORAGE_KEY);
      return null;
    }
    if (parsed.expiresAt <= Date.now()) {
      storage.removeItem(PUBLIC_AUTH_HINT_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(PUBLIC_AUTH_HINT_STORAGE_KEY);
    return null;
  }
}

function writeHintPayload(state: PublicAuthHintState, ttlMs: number): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  const payload: PublicAuthHintPayload = {
    state,
    expiresAt: Date.now() + ttlMs,
  };
  storage.setItem(PUBLIC_AUTH_HINT_STORAGE_KEY, JSON.stringify(payload));
}

export function readPublicAuthHint(): PublicAuthHintState | null {
  return readHintPayload()?.state ?? null;
}

export function markPublicAuthHintAuthenticated(): void {
  writeHintPayload("auth", AUTH_HINT_TTL_MS);
}

export function markPublicAuthHintAnonymous(): void {
  writeHintPayload("anon", ANON_HINT_TTL_MS);
}

export function clearPublicAuthHint(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(PUBLIC_AUTH_HINT_STORAGE_KEY);
}

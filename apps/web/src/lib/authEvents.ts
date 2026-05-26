/**
 * Auth event bus.
 * Allows the Axios interceptor (lib/api.ts) to notify React context
 * (AuthContext) about token lifecycle events without creating a circular dep.
 */

type AuthEventListener = () => void;

const listeners: Record<"logout" | "tokenRefreshed", AuthEventListener[]> = {
  logout: [],
  tokenRefreshed: [],
};

export function addAuthEventListener(
  event: "logout" | "tokenRefreshed",
  listener: AuthEventListener
): void {
  listeners[event].push(listener);
}

export function removeAuthEventListener(
  event: "logout" | "tokenRefreshed",
  listener: AuthEventListener
): void {
  const idx = listeners[event].indexOf(listener);
  if (idx > -1) listeners[event].splice(idx, 1);
}

export function notifyAuthListeners(event: "logout" | "tokenRefreshed"): void {
  listeners[event].forEach((fn) => fn());
}

import { USERS } from "./users";

const STORAGE_KEY = "teamdocs-user";

export function loadCurrentUserId(): string {
  if (typeof window === "undefined") return USERS[0].id;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && USERS.some((u) => u.id === saved)) return saved;
  return USERS[0].id;
}

export function saveCurrentUserId(id: string) {
  window.localStorage.setItem(STORAGE_KEY, id);
}

// Every API call carries the simulated current user in the x-user-id header.
export async function apiFetch(
  path: string,
  userId: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("x-user-id", userId);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...options, headers });
}

export interface DocumentSummary {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  owned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFull extends DocumentSummary {
  contentHtml: string;
}

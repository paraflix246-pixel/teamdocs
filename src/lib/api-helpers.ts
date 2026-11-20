import { NextResponse } from "next/server";
import { isKnownUser } from "./users";

// The simulated current user travels in the x-user-id header on every API
// call. Returns the user id, or null when the header is missing or names a
// user that does not exist.
export function userIdFromRequest(request: Request): string | null {
  const id = request.headers.get("x-user-id");
  if (!id || !isKnownUser(id)) return null;
  return id;
}

export function errorJson(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

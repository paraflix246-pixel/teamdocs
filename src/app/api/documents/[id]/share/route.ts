import { NextResponse } from "next/server";
import { getDb, getDocument, getSharedUserIds } from "@/lib/db";
import { errorJson, userIdFromRequest } from "@/lib/api-helpers";
import { canShare } from "@/lib/access";
import { getUser, isKnownUser } from "@/lib/users";

type RouteParams = { params: Promise<{ id: string }> };

async function parseTargetUserId(request: Request): Promise<string | null> {
  try {
    const body = await request.json();
    if (body && typeof body.userId === "string") return body.userId;
  } catch {
    return null;
  }
  return null;
}

async function sharesPayload(docId: string) {
  const ids = await getSharedUserIds(docId);
  return ids.map((id) => ({ userId: id, name: getUser(id)?.name ?? id }));
}

// POST /api/documents/[id]/share { userId }: grant access. Owner only.
// Sharing with the owner is rejected; granting twice is a no-op.
export async function POST(request: Request, { params }: RouteParams) {
  const userId = userIdFromRequest(request);
  if (!userId) return errorJson("Missing or unknown user.", 401);

  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return errorJson("Document not found.", 404);
  if (!canShare(doc, userId)) {
    return errorJson("Only the owner can share this document.", 403);
  }

  const targetId = await parseTargetUserId(request);
  if (!targetId || !isKnownUser(targetId)) {
    return errorJson("Unknown user to share with.", 400);
  }
  if (targetId === doc.owner_id) {
    return errorJson("The owner already has access.", 400);
  }

  await getDb().execute({
    sql: "INSERT OR IGNORE INTO shares (doc_id, user_id) VALUES (?, ?)",
    args: [id, targetId],
  });
  return NextResponse.json({ shares: await sharesPayload(id) });
}

// DELETE /api/documents/[id]/share { userId }: revoke access. Owner only.
export async function DELETE(request: Request, { params }: RouteParams) {
  const userId = userIdFromRequest(request);
  if (!userId) return errorJson("Missing or unknown user.", 401);

  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return errorJson("Document not found.", 404);
  if (!canShare(doc, userId)) {
    return errorJson("Only the owner can share this document.", 403);
  }

  const targetId = await parseTargetUserId(request);
  if (!targetId || !isKnownUser(targetId)) {
    return errorJson("Unknown user.", 400);
  }

  await getDb().execute({
    sql: "DELETE FROM shares WHERE doc_id = ? AND user_id = ?",
    args: [id, targetId],
  });
  return NextResponse.json({ shares: await sharesPayload(id) });
}

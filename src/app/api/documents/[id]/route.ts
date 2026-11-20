import { NextResponse } from "next/server";
import { getDb, getDocument, getSharedUserIds } from "@/lib/db";
import { errorJson, userIdFromRequest } from "@/lib/api-helpers";
import { canDelete, canRead, canWrite } from "@/lib/access";
import { getUser } from "@/lib/users";

type RouteParams = { params: Promise<{ id: string }> };

function toFullDocument(
  doc: NonNullable<Awaited<ReturnType<typeof getDocument>>>,
  userId: string,
) {
  return {
    id: doc.id,
    title: doc.title,
    contentHtml: doc.content_html,
    ownerId: doc.owner_id,
    ownerName: getUser(doc.owner_id)?.name ?? doc.owner_id,
    owned: doc.owner_id === userId,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

// GET /api/documents/[id]: full document, if the user may read it.
export async function GET(request: Request, { params }: RouteParams) {
  const userId = userIdFromRequest(request);
  if (!userId) return errorJson("Missing or unknown user.", 401);

  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return errorJson("Document not found.", 404);

  const sharedWith = await getSharedUserIds(id);
  if (!canRead(doc, sharedWith, userId)) {
    return errorJson("You do not have access to this document.", 403);
  }
  return NextResponse.json({ document: toFullDocument(doc, userId) });
}

// PATCH /api/documents/[id]: rename and/or save content. Write access
// required (owner or a user the document is shared with).
export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = userIdFromRequest(request);
  if (!userId) return errorJson("Missing or unknown user.", 401);

  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return errorJson("Document not found.", 404);

  const sharedWith = await getSharedUserIds(id);
  if (!canWrite(doc, sharedWith, userId)) {
    return errorJson("You do not have access to this document.", 403);
  }

  let body: { title?: unknown; contentHtml?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorJson("Request body must be JSON.", 400);
  }

  let title = doc.title;
  let contentHtml = doc.content_html;
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return errorJson("Title cannot be empty.", 400);
    }
    title = body.title.trim();
  }
  if (body.contentHtml !== undefined) {
    if (typeof body.contentHtml !== "string") {
      return errorJson("Content must be a string.", 400);
    }
    contentHtml = body.contentHtml;
  }

  const now = new Date().toISOString();
  await getDb().execute({
    sql: "UPDATE documents SET title = ?, content_html = ?, updated_at = ? WHERE id = ?",
    args: [title, contentHtml, now, id],
  });

  return NextResponse.json({
    document: toFullDocument(
      { ...doc, title, content_html: contentHtml, updated_at: now },
      userId,
    ),
  });
}

// DELETE /api/documents/[id]: owner only. Also removes its share rows.
export async function DELETE(request: Request, { params }: RouteParams) {
  const userId = userIdFromRequest(request);
  if (!userId) return errorJson("Missing or unknown user.", 401);

  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return errorJson("Document not found.", 404);

  if (!canDelete(doc, userId)) {
    return errorJson("Only the owner can delete this document.", 403);
  }

  const db = getDb();
  await db.execute({
    sql: "DELETE FROM shares WHERE doc_id = ?",
    args: [id],
  });
  await db.execute({
    sql: "DELETE FROM documents WHERE id = ?",
    args: [id],
  });
  return NextResponse.json({ ok: true });
}

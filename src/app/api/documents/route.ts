import { NextResponse } from "next/server";
import { ensureSchema, getDb } from "@/lib/db";
import { errorJson, userIdFromRequest } from "@/lib/api-helpers";
import { getUser } from "@/lib/users";

// GET /api/documents: everything the current user owns, plus everything
// shared with them, each row marked owned or shared.
export async function GET(request: Request) {
  const userId = userIdFromRequest(request);
  if (!userId) return errorJson("Missing or unknown user.", 401);

  await ensureSchema();
  const result = await getDb().execute({
    sql: `SELECT d.id, d.title, d.owner_id, d.created_at, d.updated_at,
            CASE WHEN d.owner_id = ? THEN 1 ELSE 0 END AS owned
          FROM documents d
          LEFT JOIN shares s ON s.doc_id = d.id AND s.user_id = ?
          WHERE d.owner_id = ? OR s.user_id IS NOT NULL
          ORDER BY d.updated_at DESC`,
    args: [userId, userId, userId],
  });

  const documents = result.rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    ownerId: String(row.owner_id),
    ownerName: getUser(String(row.owner_id))?.name ?? String(row.owner_id),
    owned: Number(row.owned) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
  return NextResponse.json({ documents });
}

// POST /api/documents: create a document owned by the current user.
// Body: { title?, contentHtml? }. contentHtml is used by the upload flow.
export async function POST(request: Request) {
  const userId = userIdFromRequest(request);
  if (!userId) return errorJson("Missing or unknown user.", 401);

  let body: { title?: unknown; contentHtml?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : "Untitled document";
  const contentHtml =
    typeof body.contentHtml === "string" ? body.contentHtml : "";

  await ensureSchema();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await getDb().execute({
    sql: "INSERT INTO documents (id, title, content_html, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, title, contentHtml, userId, now, now],
  });

  return NextResponse.json(
    {
      document: {
        id,
        title,
        contentHtml,
        ownerId: userId,
        ownerName: getUser(userId)?.name ?? userId,
        owned: true,
        createdAt: now,
        updatedAt: now,
      },
    },
    { status: 201 },
  );
}

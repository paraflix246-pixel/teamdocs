import { createClient, type Client } from "@libsql/client";

// Storage is libSQL. In production the app points at a Turso database via
// TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. With no env vars set it falls
// back to a local file database, so a fresh clone runs with zero setup.

export interface DocumentRow {
  id: string;
  title: string;
  content_html: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    client = url
      ? createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
      : createClient({ url: "file:./local.db" });
  }
  return client;
}

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const db = getDb();
    schemaReady = (async () => {
      await db.executeMultiple(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content_html TEXT NOT NULL DEFAULT '',
          owner_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS shares (
          doc_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          PRIMARY KEY (doc_id, user_id)
        );
      `);
    })();
  }
  return schemaReady;
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  await ensureSchema();
  const result = await getDb().execute({
    sql: "SELECT id, title, content_html, owner_id, created_at, updated_at FROM documents WHERE id = ?",
    args: [id],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: String(row.id),
    title: String(row.title),
    content_html: String(row.content_html),
    owner_id: String(row.owner_id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getSharedUserIds(docId: string): Promise<string[]> {
  await ensureSchema();
  const result = await getDb().execute({
    sql: "SELECT user_id FROM shares WHERE doc_id = ? ORDER BY user_id",
    args: [docId],
  });
  return result.rows.map((row) => String(row.user_id));
}

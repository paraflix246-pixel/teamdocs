import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// One route level test to sit alongside the access rule unit tests: the
// rules are only worth anything if the route handlers actually enforce
// them. The handlers run against a throwaway file database in the temp
// folder, pointed to by TURSO_DATABASE_URL before the route modules are
// imported (db.ts reads the env var lazily, when its client is created).

const testDbPath = path.join(
  os.tmpdir(),
  `teamdocs-route-test-${process.pid}.db`,
);

type DocumentsRoute = typeof import("../app/api/documents/route");
type DocumentRoute = typeof import("../app/api/documents/[id]/route");

let POST: DocumentsRoute["POST"];
let GET: DocumentRoute["GET"];

beforeAll(async () => {
  process.env.TURSO_DATABASE_URL = `file:${testDbPath}`;
  ({ POST } = await import("../app/api/documents/route"));
  ({ GET } = await import("../app/api/documents/[id]/route"));
});

afterAll(async () => {
  delete process.env.TURSO_DATABASE_URL;
  for (const suffix of ["", "-wal", "-shm"]) {
    await fs.rm(`${testDbPath}${suffix}`, { force: true }).catch(() => {});
  }
});

function requestAs(userId: string, init: RequestInit = {}): Request {
  return new Request("http://localhost/api/documents", {
    ...init,
    headers: { "x-user-id": userId, ...(init.headers ?? {}) },
  });
}

describe("GET /api/documents/[id]", () => {
  it("returns 403 when Sam asks for a document Alex never shared with him", async () => {
    const createRes = await POST(
      requestAs("alex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Route test document" }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    const id = created.document.id as string;

    const res = await GET(requestAs("sam"), {
      params: Promise.resolve({ id }),
    });
    expect(res.status).toBe(403);
  });
});

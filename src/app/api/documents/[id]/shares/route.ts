import { NextResponse } from "next/server";
import { getDocument, getSharedUserIds } from "@/lib/db";
import { errorJson, userIdFromRequest } from "@/lib/api-helpers";
import { canShare } from "@/lib/access";
import { getUser } from "@/lib/users";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/documents/[id]/shares: who has access. Owner only.
export async function GET(request: Request, { params }: RouteParams) {
  const userId = userIdFromRequest(request);
  if (!userId) return errorJson("Missing or unknown user.", 401);

  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return errorJson("Document not found.", 404);
  if (!canShare(doc, userId)) {
    return errorJson("Only the owner can see sharing for this document.", 403);
  }

  const ids = await getSharedUserIds(id);
  return NextResponse.json({
    shares: ids.map((sharedId) => ({
      userId: sharedId,
      name: getUser(sharedId)?.name ?? sharedId,
    })),
  });
}

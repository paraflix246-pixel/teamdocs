// Pure access rules for TeamDocs, shared by every API route and unit tested
// in access.test.ts. A document has one owner. The owner can do everything.
// A user the document is shared with can read and edit, but cannot share it
// further or delete it. Everyone else gets nothing.

export interface DocLike {
  owner_id: string;
}

export function isOwner(doc: DocLike, userId: string): boolean {
  return doc.owner_id === userId;
}

export function canRead(
  doc: DocLike,
  sharedWith: string[],
  userId: string,
): boolean {
  return isOwner(doc, userId) || sharedWith.includes(userId);
}

export function canWrite(
  doc: DocLike,
  sharedWith: string[],
  userId: string,
): boolean {
  // Same rule as read for this scope: anyone with access can edit.
  return canRead(doc, sharedWith, userId);
}

export function canShare(doc: DocLike, userId: string): boolean {
  return isOwner(doc, userId);
}

export function canDelete(doc: DocLike, userId: string): boolean {
  return isOwner(doc, userId);
}

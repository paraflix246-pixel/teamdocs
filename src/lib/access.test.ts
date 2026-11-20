import { describe, expect, it } from "vitest";
import { canDelete, canRead, canShare, canWrite, isOwner } from "./access";

const doc = { owner_id: "alex" };
const sharedWithMaria = ["maria"];

describe("owner access", () => {
  it("recognizes the owner", () => {
    expect(isOwner(doc, "alex")).toBe(true);
    expect(isOwner(doc, "maria")).toBe(false);
  });

  it("lets the owner read and write", () => {
    expect(canRead(doc, [], "alex")).toBe(true);
    expect(canWrite(doc, [], "alex")).toBe(true);
  });

  it("lets the owner share and delete", () => {
    expect(canShare(doc, "alex")).toBe(true);
    expect(canDelete(doc, "alex")).toBe(true);
  });
});

describe("shared user access", () => {
  it("lets a shared user read and write", () => {
    expect(canRead(doc, sharedWithMaria, "maria")).toBe(true);
    expect(canWrite(doc, sharedWithMaria, "maria")).toBe(true);
  });

  it("does not let a shared user share or delete", () => {
    expect(canShare(doc, "maria")).toBe(false);
    expect(canDelete(doc, "maria")).toBe(false);
  });
});

describe("strangers", () => {
  it("get no access at all", () => {
    expect(canRead(doc, sharedWithMaria, "sam")).toBe(false);
    expect(canWrite(doc, sharedWithMaria, "sam")).toBe(false);
    expect(canShare(doc, "sam")).toBe(false);
    expect(canDelete(doc, "sam")).toBe(false);
  });

  it("get nothing when the document is shared with nobody", () => {
    expect(canRead(doc, [], "maria")).toBe(false);
    expect(canWrite(doc, [], "maria")).toBe(false);
  });
});

"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UserSwitcher from "@/components/UserSwitcher";
import ShareDialog from "@/components/ShareDialog";
import {
  apiFetch,
  loadCurrentUserId,
  saveCurrentUserId,
  type DocumentFull,
} from "@/lib/client";

type SaveStatus = "saved" | "saving" | "error";

function Toolbar({ editor }: { editor: Editor }) {
  const [, setTick] = useState(0);

  // Re-render the toolbar when the selection or content changes so the
  // active states on the buttons stay correct.
  useEffect(() => {
    const update = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const buttons: {
    label: string;
    active: boolean;
    action: () => void;
  }[] = [
    {
      label: "Bold",
      active: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      active: editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      active: editor.isActive("underline"),
      action: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "H1",
      active: editor.isActive("heading", { level: 1 }),
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "H2",
      active: editor.isActive("heading", { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bullet list",
      active: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      active: editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <div className="toolbar">
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          className={`toolbar-btn${button.active ? " is-active" : ""}`}
          onClick={button.action}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}

function EditorArea({
  doc,
  userId,
}: {
  doc: DocumentFull;
  userId: string;
}) {
  const [title, setTitle] = useState(doc.title);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: doc.contentHtml || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      setSaveStatus("saving");
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(async () => {
        const res = await apiFetch(`/api/documents/${doc.id}`, userId, {
          method: "PATCH",
          body: JSON.stringify({ contentHtml: current.getHTML() }),
        });
        setSaveStatus(res.ok ? "saved" : "error");
      }, 800);
    },
  });

  async function commitTitle() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError("Title cannot be empty.");
      setTitle(doc.title);
      return;
    }
    if (trimmed === doc.title) return;
    setTitleError(null);
    const res = await apiFetch(`/api/documents/${doc.id}`, userId, {
      method: "PATCH",
      body: JSON.stringify({ title: trimmed }),
    });
    if (!res.ok) {
      setTitleError("The title could not be saved.");
      setTitle(doc.title);
    }
  }

  return (
    <div>
      <div className="editor-topbar">
        <input
          className="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          aria-label="Document title"
        />
        <span className="save-status" aria-live="polite">
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && "Could not save"}
        </span>
        {doc.owned ? (
          <button className="btn" onClick={() => setShareOpen(true)}>
            Share
          </button>
        ) : (
          <span className="badge">Shared with you</span>
        )}
      </div>

      {!doc.owned && (
        <p className="hint">
          This document is owned by {doc.ownerName} and shared with you. You
          can edit it, and your changes save like your own documents.
        </p>
      )}
      {titleError && <p className="error-text">{titleError}</p>}

      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} className="editor-content" />

      {shareOpen && (
        <ShareDialog
          docId={doc.id}
          userId={userId}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

export default function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [userId, setUserId] = useState<string | null>(null);
  const [doc, setDoc] = useState<DocumentFull | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "forbidden" | "missing">(
    "loading",
  );

  useEffect(() => {
    setUserId(loadCurrentUserId());
  }, []);

  const loadDoc = useCallback(
    async (uid: string) => {
      setState("loading");
      const res = await apiFetch(`/api/documents/${id}`, uid);
      if (res.ok) {
        const data = await res.json();
        setDoc(data.document);
        setState("ready");
      } else if (res.status === 404) {
        setState("missing");
      } else {
        setState("forbidden");
      }
    },
    [id],
  );

  useEffect(() => {
    if (userId) loadDoc(userId);
  }, [userId, loadDoc]);

  function handleUserChange(nextId: string) {
    saveCurrentUserId(nextId);
    setUserId(nextId);
  }

  return (
    <div className="page">
      <header className="app-header">
        <Link href="/" className="back-link">
          Back to documents
        </Link>
        <div className="brand">TeamDocs</div>
        {userId && (
          <UserSwitcher userId={userId} onChange={handleUserChange} />
        )}
      </header>

      <main className="container">
        {state === "loading" && <p className="empty-text">Loading...</p>}
        {state === "missing" && (
          <p className="empty-text">
            This document does not exist. It may have been deleted.
          </p>
        )}
        {state === "forbidden" && (
          <p className="empty-text">
            You do not have access to this document. If someone meant to share
            it with you, check that you are acting as the right user above.
          </p>
        )}
        {state === "ready" && doc && userId && (
          <EditorArea key={`${doc.id}-${userId}`} doc={doc} userId={userId} />
        )}
      </main>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import UserSwitcher from "@/components/UserSwitcher";
import {
  apiFetch,
  loadCurrentUserId,
  saveCurrentUserId,
  type DocumentSummary,
} from "@/lib/client";
import { fileTextToHtml, isSupportedUpload, titleFromFileName } from "@/lib/convert";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HomePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUserId(loadCurrentUserId());
  }, []);

  const loadDocuments = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/documents", uid);
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setDocuments(data.documents);
    } catch {
      setError("Documents could not be loaded. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) loadDocuments(userId);
  }, [userId, loadDocuments]);

  function handleUserChange(id: string) {
    saveCurrentUserId(id);
    setUserId(id);
  }

  async function handleNewDocument() {
    if (!userId || busy) return;
    setBusy(true);
    try {
      const res = await apiFetch("/api/documents", userId, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("create failed");
      const data = await res.json();
      router.push(`/doc/${data.document.id}`);
    } catch {
      setError("The document could not be created. Please try again.");
      setBusy(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !userId) return;
    if (!isSupportedUpload(file.name)) {
      setUploadError(
        "That file type is not supported. Please choose a .txt or .md file.",
      );
      return;
    }
    setUploadError(null);
    setBusy(true);
    try {
      const text = await file.text();
      const res = await apiFetch("/api/documents", userId, {
        method: "POST",
        body: JSON.stringify({
          title: titleFromFileName(file.name),
          contentHtml: fileTextToHtml(file.name, text),
        }),
      });
      if (!res.ok) throw new Error("upload failed");
      const data = await res.json();
      router.push(`/doc/${data.document.id}`);
    } catch {
      setUploadError("The file could not be uploaded. Please try again.");
      setBusy(false);
    }
  }

  async function handleDelete(doc: DocumentSummary) {
    if (!userId) return;
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) {
      return;
    }
    const res = await apiFetch(`/api/documents/${doc.id}`, userId, {
      method: "DELETE",
    });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } else {
      setError("The document could not be deleted.");
    }
  }

  const mine = documents.filter((d) => d.owned);
  const shared = documents.filter((d) => !d.owned);

  return (
    <div className="page">
      <header className="app-header">
        <div className="brand">TeamDocs</div>
        {userId && (
          <UserSwitcher userId={userId} onChange={handleUserChange} />
        )}
      </header>

      <main className="container">
        <div className="actions-row">
          <button
            className="btn btn-primary"
            onClick={handleNewDocument}
            disabled={!userId || busy}
          >
            New Document
          </button>
          <button
            className="btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={!userId || busy}
          >
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            hidden
            onChange={handleUpload}
          />
          <span className="hint">Uploads: .txt and .md files become new documents.</span>
        </div>

        {uploadError && <p className="error-text">{uploadError}</p>}
        {error && <p className="error-text">{error}</p>}

        <section>
          <h2 className="section-title">My documents</h2>
          {loading ? (
            <p className="empty-text">Loading...</p>
          ) : mine.length === 0 ? (
            <p className="empty-text">
              No documents yet. Create one, or upload a .txt or .md file.
            </p>
          ) : (
            <div className="doc-grid">
              {mine.map((doc) => (
                <div key={doc.id} className="doc-card">
                  <button
                    className="doc-card-main"
                    onClick={() => router.push(`/doc/${doc.id}`)}
                  >
                    <span className="doc-card-title">{doc.title}</span>
                    <span className="doc-card-meta">
                      Edited {formatDate(doc.updatedAt)}
                    </span>
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(doc)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="section-title">Shared with me</h2>
          {loading ? (
            <p className="empty-text">Loading...</p>
          ) : shared.length === 0 ? (
            <p className="empty-text">
              Nothing has been shared with you yet. Ask a teammate to share a
              document with you, then switch back here.
            </p>
          ) : (
            <div className="doc-grid">
              {shared.map((doc) => (
                <div key={doc.id} className="doc-card">
                  <button
                    className="doc-card-main"
                    onClick={() => router.push(`/doc/${doc.id}`)}
                  >
                    <span className="doc-card-title">
                      {doc.title} <span className="badge">Shared</span>
                    </span>
                    <span className="doc-card-meta">
                      Owned by {doc.ownerName} · Edited{" "}
                      {formatDate(doc.updatedAt)}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

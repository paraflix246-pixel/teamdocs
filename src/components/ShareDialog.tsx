"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import { USERS } from "@/lib/users";

interface ShareEntry {
  userId: string;
  name: string;
}

interface Props {
  docId: string;
  userId: string;
  onClose: () => void;
}

// Owner-only dialog: grant or revoke access for the other seeded users.
export default function ShareDialog({ docId, userId, onClose }: Props) {
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch(`/api/documents/${docId}/shares`, userId);
    if (res.ok) {
      const data = await res.json();
      setShares(data.shares);
    } else {
      setError("Sharing details could not be loaded.");
    }
  }, [docId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(targetId: string, grant: boolean) {
    setBusyId(targetId);
    setError(null);
    const res = await apiFetch(`/api/documents/${docId}/share`, userId, {
      method: grant ? "POST" : "DELETE",
      body: JSON.stringify({ userId: targetId }),
    });
    if (res.ok) {
      const data = await res.json();
      setShares(data.shares);
    } else {
      setError("That change could not be saved. Please try again.");
    }
    setBusyId(null);
  }

  const others = USERS.filter((u) => u.id !== userId);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-label="Share document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3>Share this document</h3>
          <button className="btn btn-small" onClick={onClose}>
            Close
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <ul className="share-list">
          {others.map((user) => {
            const hasAccess = shares.some((s) => s.userId === user.id);
            return (
              <li key={user.id} className="share-row">
                <span>
                  {user.name}
                  {hasAccess && <span className="badge">Has access</span>}
                </span>
                <button
                  className="btn btn-small"
                  disabled={busyId === user.id}
                  onClick={() => toggle(user.id, !hasAccess)}
                >
                  {hasAccess ? "Revoke" : "Grant access"}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="hint">
          {shares.length === 0
            ? "Only you can see this document right now."
            : `Shared with: ${shares.map((s) => s.name).join(", ")}.`}
        </p>
      </div>
    </div>
  );
}

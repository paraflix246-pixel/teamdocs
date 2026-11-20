"use client";

import { USERS } from "@/lib/users";

interface Props {
  userId: string;
  onChange: (id: string) => void;
}

// Simulated sign-in: pick which seeded user you are acting as.
export default function UserSwitcher({ userId, onChange }: Props) {
  return (
    <label className="user-switcher">
      <span className="user-switcher-label">Acting as</span>
      <select value={userId} onChange={(e) => onChange(e.target.value)}>
        {USERS.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export interface SeedUser {
  id: string;
  name: string;
}

// Auth is simulated for this exercise: three seeded users, no passwords.
// The brief allows seeded accounts or a lightweight login flow in place of
// real authentication. The current user is picked in the header switcher.
export const USERS: SeedUser[] = [
  { id: "alex", name: "Alex Rivera" },
  { id: "maria", name: "Maria Chen" },
  { id: "sam", name: "Sam Patel" },
];

export function getUser(id: string): SeedUser | undefined {
  return USERS.find((u) => u.id === id);
}

export function isKnownUser(id: string): boolean {
  return USERS.some((u) => u.id === id);
}

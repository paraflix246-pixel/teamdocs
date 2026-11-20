# TeamDocs architecture note

## What I prioritized

The brief asked for the strongest working slice of a Google Docs style
product inside a tight timebox, so I prioritized the core loop in this
order:

1. Create, edit, save, and reopen a document, with formatting that survives
   the round trip to the server.
2. Sharing that actually enforces something, because sharing is where a
   demo like this usually turns into theatre. Every API route checks access
   on the server, and the rules live in one small pure module
   (`src/lib/access.ts`) that is unit tested.
3. Upload, because it is a small amount of code for a visibly complete
   workflow.
4. Polish, only after the above worked end to end.

Real time collaboration, comments, and version history were cut on purpose.
They are the features most likely to eat the whole timebox and leave the
basics shaky.

## Stack

- Next.js (App Router) with TypeScript, one codebase for the pages and the
  API routes. Route handlers live under `src/app/api/documents`.
- TipTap for the editor. It gives a sane document model and the required
  formatting (bold, italic, underline, headings, lists) without hand
  rolling contentEditable behavior.
- libSQL for storage, through `@libsql/client`. The same code talks to a
  hosted Turso database in production (via `TURSO_DATABASE_URL` and
  `TURSO_AUTH_TOKEN`) and to a local file database (`file:./local.db`) with
  zero setup locally. Tables are created with CREATE TABLE IF NOT EXISTS on
  first use, so there is no migration step to run.

## Data model

Two tables:

- `documents`: id, title, content_html, owner_id, created_at, updated_at.
  Content is stored as the HTML the editor produces. That keeps formatting
  intact with no custom serialization format to design or debug.
- `shares`: doc_id and user_id pairs, primary key on the pair, which makes
  granting access idempotent for free.

## Auth, and the deliberate shortcut

Users are three seeded accounts (Alex Rivera, Maria Chen, Sam Patel) in
`src/lib/users.ts`. The header switcher stores the current user in
localStorage, and API calls carry the user id in an `x-user-id` header,
which the server validates against the seeded list. This is simulated auth,
chosen openly: the brief allows seeded accounts, and real auth (sessions,
passwords, email) would have consumed the timebox without showing anything
about document editing or sharing. The access model does not depend on the
shortcut. Swapping the header for a real session cookie only changes
`userIdFromRequest` in `src/lib/api-helpers.ts`; every rule downstream
stays the same.

## Access model

- Owner: read, write, share, delete.
- Shared user: read and write. Cannot share further, cannot delete.
- Anyone else: nothing. The API returns 403, and shared documents never
  appear in their list.

The list endpoint runs one query that joins documents against shares for
the current user and marks each row owned or shared, so the home page
sections and the Shared badge come straight from the data.

## Client behavior worth noting

- The editor autosaves with an 800ms debounce and a plain status label that
  cycles between Saving... and Saved. A failed save shows Could not save
  instead of silently pretending, whether the server rejected it or the
  network dropped. If I leave the page with a save still pending, the
  editor flushes that last save on the way out, so the final keystrokes
  are not lost.
- Rename happens in place on the title field, committed on blur or Enter,
  with empty titles rejected by both the client and the API.
- Upload conversion is intentionally naive (headings and paragraphs only)
  and the supported types, .txt and .md, and the 100 KB size limit are
  stated in the UI next to the button rather than buried in this document.

## What I would build next

In order: real authentication with sessions; real time collaboration using
a CRDT (Yjs fits TipTap well) with presence; version history, which the
updated_at discipline already half prepares for; .docx import; and
read only versus edit roles for shared users, which the access module can
express with one more rule.

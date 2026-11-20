# Submission: TeamDocs

A lightweight collaborative document editor (Google Docs inspired),
built as a timed take home exercise.

## Links

- Live product: [LIVE_URL]
- Walkthrough video: [VIDEO_URL]
- Source code: this folder

## What is included

- [ ] Source code for the full app (Next.js, TypeScript, TipTap, libSQL)
- [ ] README.md with setup and run instructions
- [ ] ARCHITECTURE.md, what was prioritized and why
- [ ] AI_WORKFLOW.md, how AI tools were used on this build
- [ ] SUBMISSION.md, this file
- [ ] A live deployment reviewers can open
- [ ] Walkthrough video link (also pasted in the portal form)

## Test accounts

Auth is simulated with seeded users. There are no passwords. Use the
"Acting as" switcher in the header:

- Alex Rivera (alex)
- Maria Chen (maria)
- Sam Patel (sam)

Suggested review path: as Alex, create a document and share it with
Maria. Switch to Maria to see it under "Shared with me" and edit it.
Switch to Sam to confirm he has no access.

## Run it locally

```bash
npm install
npm run dev
```

No database setup is needed locally; without env vars the app uses a
local file database. For a hosted database, set TURSO_DATABASE_URL and
TURSO_AUTH_TOKEN. Run the tests with `npm test`.

## What works

- Create, rename, edit, and delete documents
- Rich text: bold, italic, underline, H1, H2, bullet and numbered lists
- Autosave with a visible Saving... / Saved status
- Upload .txt and .md files as new documents (other types are rejected
  with a clear message, and the limit is stated in the UI)
- Sharing: owner grants or revokes access per user, enforced on the server
- Owned versus shared documents, with a Shared badge and owner name
- Persistence across refresh, for both content and sharing
- Automated tests for the access rules (7 tests, passing)

## What is incomplete

- No real time collaboration: two people can open the same document, but
  they do not see each other typing, and the last save wins.
- No comments, no version history, no .docx import.
- Auth is simulated with seeded users, as the brief allows. There are no
  passwords or sessions.

## With another 2 to 4 hours I would

1. Add real time collaboration with Yjs and TipTap's collaboration
   extensions, plus simple presence (who is viewing this document).
2. Add version history: snapshot content on save, list past versions,
   restore in one click.
3. Replace simulated auth with email and password accounts and sessions,
   keeping the same access rules underneath.
4. Support .docx upload through a proper converter.

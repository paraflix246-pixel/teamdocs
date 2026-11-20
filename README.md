# TeamDocs

TeamDocs is a lightweight collaborative document editor, inspired by Google
Docs and deliberately kept small. You can create documents, write in a rich
text editor, upload text files as new documents, and share documents with
teammates. Everything is saved on the server, so documents survive a refresh
and shared access works across users.

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

No database setup is needed for local runs. If the environment variables
below are not set, the app uses a local file database (`local.db`, created
automatically on first run).

To use a hosted Turso database instead, set:

```bash
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-token
```

## Test accounts and the sharing demo

Auth is simulated with seeded users, which the assignment brief allows.
There are no passwords. Use the "Acting as" switcher in the header to change
who you are:

- Alex Rivera (alex)
- Maria Chen (maria)
- Sam Patel (sam)

To see sharing work end to end:

1. Acting as Alex, create a document and write something in it.
2. Open the document and click Share, then grant access to Maria Chen.
3. Switch the user to Maria Chen. The document now appears under
   "Shared with me" on the home page, with a Shared badge.
4. Open it as Maria and edit. The changes save, just like her own documents.
5. Switch to Sam Patel. He cannot see or open the document at all.

## Uploads

The Upload button on the home page accepts .txt and .md files only, and the
UI says so next to the button. An uploaded file becomes a new editable
document, titled after the file name. For Markdown files, lines starting
with `# ` become top level headings, `## ` become second level headings, and
other lines become paragraphs. Plain text files are wrapped line by line in
paragraphs. Other file types, including .docx, are not supported in this
version, and picking one shows a friendly error.

## Tests

```bash
npm test
```

This runs the Vitest suite for the access rules in `src/lib/access.ts`:
owners can do everything, shared users can read and edit but not share or
delete, and everyone else gets nothing.

## Scope

Built: document create, rename, edit and delete; rich text with bold,
italic, underline, headings, and bullet and numbered lists; autosave;
.txt and .md upload; sharing with grant and revoke; an owned versus shared
distinction everywhere it matters; server side persistence.

Deliberately left out: real time collaboration (two people typing in the
same document at once), comments, and version history. Each of those is a
project of its own, and the time was better spent making the core loop of
create, edit, share, and reopen solid and demonstrable. See
ARCHITECTURE.md for the reasoning and what would come next.

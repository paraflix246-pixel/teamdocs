# AI workflow note

## What I used

I built TeamDocs with an AI coding assistant (Muse) doing the typing,
working from a short written plan I set first: the stack (Next.js, TipTap,
libSQL), the data model, the API surface, and the access rules. I reviewed
each piece as it landed and ran the verification steps myself.

## Where AI materially sped things up

- Scaffolding and wiring. The Next.js project layout, the route handler
  files, and the TipTap editor setup are all patterns the assistant
  produces quickly and correctly, which left my time for the decisions.
- API route boilerplate. Eight route handlers with consistent error
  handling (401 for a missing user, 404 for a missing document, 403 for no
  access) came out uniform because they were generated from one pattern.
- Tests. The access rule test cases were drafted alongside the rules
  themselves, so the suite existed before I ever ran the app.
- First drafts of the README and the architecture note, which I then cut
  down and corrected.

## What I changed or rejected

- The plan said to add the TipTap underline extension as a separate
  package on top of StarterKit. Checking the installed version showed
  StarterKit in TipTap 3 already bundles underline, so registering it
  twice would have been a duplicate extension. I kept StarterKit only.
- The first production build failed on the editor page: this version of
  Next.js, with cache components, refuses to prerender a page that reads
  route params outside a Suspense boundary. The assistant's first version
  had the params read in the page component directly. I restructured it
  into a thin server wrapper with Suspense around a client component,
  which is the shape this Next.js version wants.
- The initial dependency install failed because the newest Vitest wants a
  newer @types/node than the scaffold ships. Rather than pin an older
  test runner, I upgraded @types/node, which is the safer direction.
- I rejected a heavier upload plan (full Markdown parsing, .docx support)
  in favor of the simple line based conversion, and documented the limit
  in the UI. A real parser is the right call later; it was the wrong call
  inside this timebox.

## How I verified

- `npm test`: 8 tests pass. Seven cover the access rules directly, and one is a route test that runs the real API handlers and confirms Sam gets a 403 on a document he has no access to.
- `npm run build`: the production build passes, including type checking.
- Manual smoke against the dev server with curl: created a document as
  Alex, shared it with Maria, confirmed it appears in Maria's list as
  shared, confirmed Maria can edit it, confirmed she cannot delete it,
  confirmed Sam gets a 403 on it, and confirmed the error codes for a
  missing document (404), a missing user header (401), and sharing with
  the owner (400).
- The same create, share, switch user, reopen flow was exercised against
  the running server for the page routes as well: the home page and the
  editor page both serve with HTTP 200 from the production build.

Nothing in the app was pasted in unverified. Every claim in the README
was exercised at least once.

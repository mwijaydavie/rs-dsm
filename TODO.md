# TODO

- [ ] Fix Next.js build error: “Event handlers cannot be passed to Client Component props” on `landing/src/app/page.tsx` (Vercel prerender failure).
  - [ ] Update `landing/src/app/page.tsx` to remove/avoid client-only patterns during prerender (e.g., `dangerouslySetInnerHTML` with inline scripts, or ensure correct server/client component boundaries).
  - [ ] Re-run `npm run vercel-build` in `landing/` to confirm build passes.
- [ ] (After build success) Verify page renders and navigation works.


# NEXT STEPS

This file contains an actionable checklist for the Home page / Superuser Dashboard improvements and bug fixes. Mark tasks done as you complete them (e.g. `- [x]`).

## High Priority

- [ ] Restore vendor coordinates + caching
  - Why: Vendor coordinates are required for distance/ETA and proximity-based sorting.
  - Files: `src/pages/Home.jsx`, consider adding helper in `src/lib/db.js` (e.g. `getPharmaciesByIds(ids)`).
  - Notes: Batch fetch only vendor IDs referenced by visible products; cache results in `vendors` state.

- [ ] Verify info cards listener and data
  - Why: Carousel only renders when `infoCards` are present.
  - Files: `src/pages/Home.jsx`.
  - Notes: Add a diagnostic `console.log` inside the `onSnapshot` callback to confirm data and shape (fields: `header`, `preview`, `image`/`fullImage`, `link`, `linkText`, `bgColor`).

- [ ] Trimmed client-side sorting and vendor fetch
  - Why: Prevent expensive operations on very large product lists.
  - Files: `src/pages/Home.jsx`.
  - Notes: Use a TRIM_N (e.g., 200) before proximity sort; only fetch vendors for trimmed set.

## Medium Priority

- [ ] Add missing-coords UI & admin validation
  - Why: Surface vendors missing coordinates and provide workflow to fix them from Superuser Dashboard.
  - Files: `src/components/ProductCard.jsx`, Superuser dashboard files.
  - Notes: Add visual pill or icon on ProductCard; add edit action in admin to fill coordinates.

- [ ] Improve ETA accuracy (travel-time)
  - Why: Straight-line ETA is misleading; replace with a travel-time API when accuracy is required.
  - Files: `src/lib/` (new helper), optional server/cloud function.
  - Notes: Consider Mapbox/Google/HERE and caching.

- [ ] Carousel features for Info Cards (admin)
  - Why: Improve admin capabilities: image upload, publish scheduling, rich text.
  - Files: Superuser dashboard, `src/pages/Home.jsx`.
  - Notes: Add `published`, `startAt`, `endAt` fields and filter client-side.

## Low Priority / Improvements

- [ ] Server-side geo queries for scale
  - Why: Client-side sorting will not scale; use Firestore geohash or external search (Algolia) or Cloud Function.
  - Files: Backend/Cloud Functions, migration plan document.

- [ ] Error boundary & observability
  - Why: Graceful fallbacks and better debug info for production.
  - Files: `src/App.jsx`, logging infrastructure.

- [ ] Accessibility & UX polish
  - Why: Keyboard controls, reduced-motion, aria attributes and contrast.
  - Files: `src/pages/Home.jsx`, CSS/tailwind config.

- [ ] Tests & CI
  - Why: Prevent regressions in sorting, pagination and listeners.
  - Files: tests folder, CI config.

---

If you want I can implement any single item from the list now (suggest starting with "Restore vendor coordinates + caching" or adding infoCards diagnostics). Tell me which one to pick and I'll start editing the code.

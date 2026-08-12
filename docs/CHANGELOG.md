# Changelog

## 2026-08-03

### Added

- Initialized Nuxt 4 project.
- Selected project stack:
  - Nuxt 4
  - TypeScript
  - Pinia
  - SCSS
  - Vant | vant/nuxt
  - VueUse
- Created initial project documentation.
- Defined MVP.

### Changed

- Registration moved out of the initial user flow.
- Users can complete several workouts before creating an account.

### Notes

- Backend postponed until after MVP.
- Project is mobile-first.

## 2026-08-10

### Added

- Workout tab (`/`): add/remove exercises and sets for a selected day, rest timer (90s, auto-starts after logging a set), personal record (PR) badge on sets that match the all-time max weight.
- History tab (`/history`): list of past workouts with stats, tap an entry to jump back to that day.
- Per-exercise history popup: past sessions, best set, total volume.
- Static exercise catalog (6 muscle groups, ~35 exercises) and exercise picker (group → exercise).
- Local persistence via `localStorage` (VueUse `useStorage`) — no backend involved.

### Changed

- Extended `Exercise` type with an optional `equipment` field.
- Split UI into `TheHeader` (calendar-driven date navigation) / `TheFooter` (bottom tab bar) and domain component folders (`components/workout`, `components/history`).
- Disabled SSR (`ssr: false`) — app is fully client/`localStorage`-driven; SSR hydration was resetting saved workouts on every reload.

### Fixed

- Vant UI locale defaulting to Chinese — added an English locale plugin.
- Calendar required a second tap/confirm button to close — now closes immediately on date tap.
- Duplicate "Add exercise" button on the empty state (kept only the floating action button).

### Notes

- Feature set intentionally excludes Templates (prebuilt programs) and a separate Progress tab — out of MVP scope per `docs/02-mvp.md`.

## 2026-08-11

### Added

- Multi-language support (i18n) via `@nuxtjs/i18n`: English and Russian, with browser-language auto-detection and a manual EN/RU toggle in the header (persisted in a cookie).
- Full Russian translation of the UI copy and the exercise catalog (6 muscle groups, ~35 exercise names, equipment labels).
- `app/utils/pluralize.ts` — correct Russian plural forms (one/few/many) for counted nouns ("1 упражнение" / "2 упражнения" / "5 упражнений"), not just naive number interpolation.
- Vant's own component locale (calendar, etc.) now switches together with the app language (`en-US` / `ru-RU`).
- Delete-set now asks for confirmation before removing a logged set, mirroring the existing delete-exercise confirmation.
- Swipe navigation on the Workout page: swipe left/right to move ±1 day, with a direction-aware slide/fade transition (`useSwipe` from VueUse, `app/utils/date.ts#addDays`).

### Changed

- `docs/00-vision.md` — documented that translations live on the frontend permanently, not as a stopgap until a backend exists (see rationale there).
- `app/utils/format.ts` — `formatWeight()` replaced with `isBodyweight()`; the "kg"/"BW" unit text now comes from translations instead of being hardcoded.
- `app/utils/date.ts` — date/weekday formatting now takes the active locale instead of a hardcoded `'en-US'`.
- Removed the unused `exerciseName` field from `ui.addSetSheet` state — the add-set sheet now resolves the (translated) exercise name from `exerciseId` directly instead of carrying a pre-resolved English string.

### Fixed

- Locale-sync logic was originally a Nuxt plugin calling `useI18n()`, which crashed the app on load ("Must be called at the top of a setup function") — moved into `app.vue`'s `<script setup>`, which has a guaranteed valid composition context.
- Muscle-group/set counts showed grammatically wrong Russian ("1 упражнений") before the pluralization fix above.
- PR badge was shown on every set tied at the record weight instead of just the most recent one — `ExerciseCard.vue` now picks a single set to badge (`prSetId`, the last qualifying set) instead of testing each set independently.
- Cancelling a delete confirmation dialog threw an unhandled promise rejection ("Uncaught (in promise) cancel") — Vant's `showConfirmDialog` rejects on cancel; both `removeSet`/`removeExercise` in `index.vue` now wrap it in try/catch.

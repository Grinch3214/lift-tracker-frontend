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

## 2026-08-14

### Added

- Left-side menu (`TheSidebar.vue`, `van-popup position="left"`), opened via a new burger icon in the header (replaces the old inline EN/RU text toggle): placeholder menu list at the top (commented-out `v-for` scaffold until real menu content is decided), an accent-color picker, and EN/RU language buttons underneath.
- Selectable accent color (7 presets), persisted to `localStorage` via a new `app/stores/settings.ts`, applied app-wide through CSS custom properties.
- Language buttons in the sidebar are generated from `useI18n().locales` instead of being hardcoded — adding a third language later needs no template changes.
- History list now shows the muscle groups trained that day (deduplicated, e.g. "Chest, Back, Legs") instead of the full exercise name list.

### Changed

- Adopted BEM (`block__element`, SCSS `&`-nesting) across every component's `<style>` block, plus logical CSS properties (`margin-block-end`, `border-block-start`, `inset-inline-end`, etc.) in place of physical ones for single-edge declarations.
- Unified the app's accent color: `--van-primary-color` is now set dynamically from the picker instead of being partly Vant's own default (`#1989fa`, via `var(--van-primary-color)` in most components) and partly a second, different hardcoded blue (`#3c8ee0`, in the calendar and tab bar). A second variable, `--van-primary-color-channels` (bare "R G B", no `rgb()` wrapper), lets components compose translucent variants (`rgb(var(...) / 40%)`) without touching Vant's own variable, which must stay a full color.
- Extracted the "·" separator dot (used identically in the history list and the exercise-history modal) into a shared `.dot` utility in `app/assets/scss/_global.scss` instead of duplicating the rule in both components.
- Added `viewport-fit=cover` to the viewport meta tag so `env(safe-area-inset-bottom)` (used for the sidebar's bottom padding) resolves to a real value instead of always being `0px`.
- Removed the manual `padding-block-end` / `padding-block: ... var(--van-tabbar-height)` workarounds in `EmptyState.vue` and `history.vue` — no longer needed now that the tab bar reserves its own space via `placeholder`.

### Fixed

- `RestTimer.vue` was missed during the color-picker work and still used the old hardcoded `rgba(60, 142, 224, ...)` blue — now follows the selected accent color like everything else.
- History list could overflow horizontally when a workout had many/long exercise names — root cause was a flex child with `white-space: nowrap` and no `min-width: 0`, so it refused to shrink and pushed the page wider than the viewport instead of truncating. Fixed at the source (`min-width: 0` on `.workout-item__group-names`) rather than papering over it with `overflow-x: hidden` on `<main>`.
- The Workout page's exercise/sets summary line could render hidden behind the fixed bottom tab bar on short days — `van-tabbar` now uses Vant's own `placeholder` prop, which reserves real layout space for it instead of floating over content.
- The floating "+" button could likewise cover the last line of content (e.g. that same summary line) — `<main>` now reserves clearance for it at the layout level (`default.vue`), not per-page.
- Opening any popup/action-sheet/calendar (Vant locks page scroll via `overflow: hidden` on `<body>`) shifted page content sideways on desktop browsers with classic, space-reserving scrollbars. `scrollbar-gutter: stable` is scoped to `body.van-overflow-hidden` — the exact class Vant toggles for the lock — so the reserved space appears and disappears together with the real scrollbar instead of being reserved permanently (which looked like a bare gutter on the right at all times). No effect on real mobile devices, where scrollbars are overlay and never reserve space to begin with.

### Notes

- Accent-color customization wasn't in the original MVP scope (`docs/02-mvp.md`) but was built now rather than later — see `docs/00-vision.md` for why.

## 2026-08-15

### Added

- Multi-select in the exercise picker (tap to toggle, sticky "Добавить | N" adds all at once).
- Drag-and-drop reordering of exercises within a day (press-and-hold, new dep: `@vueuse/integrations`'s `useSortable`).
- Logging the same exercise more than once per day is now allowed.
- Autofocus on the weight field when the add-set popup opens.

### Changed

- `workoutStore.addExercise` no longer merges duplicates by `exerciseId` — always creates a new entry; `getExerciseHistory` now aggregates across all of a day's matches instead of just the first.
- `AddSetSheet.vue` is a centered popup now, not a bottom-sheet drawer.
- `TheSidebar.vue`: EN/RU buttons moved up next to the close icon (circular, matches the color swatches — sized for a future flag-icon swap), color-picker row is horizontally scrollable with its native scrollbar hidden.
- Exercise-card spacing switched from per-card margin to a single `gap` on the list container — margins on adjacent flex items don't collapse, so the old approach silently doubled the visual gap.

### Fixed

- `crypto.randomUUID` isn't available over plain HTTP by LAN IP (insecure context) — crashed id-generation when testing on a phone. New `app/utils/id.ts#generateId()` fallback.
- On-screen keyboard could cover the add-set popup on a real phone — fixed via `interactive-widget=resizes-content` on the viewport meta.

### Removed

- Per-exercise history popup (title-tap on an exercise card) — not discoverable, and long-pressing text to start a drag triggered native text-selection instead. `/history` already covers this at the day level; `docs/02-mvp.md`/`03-roadmap.md` updated.

### Notes

- Two gotchas from this work are documented in `CLAUDE.md` rather than here: nested-reactive-array tracking (`index.vue`'s `useSortable` working copy) and vue-i18n parsing a literal `|` as its plural separator even through plain `t()`.

## 2026-08-16

### Changed

- Chest catalog expanded from 6 to 25 exercises (barbell/dumbbell/Smith-machine variants for flat/incline/decline press, lever crossover, hammer press, pec deck, cable crossover variants, pullover variants, etc.) — the old placeholder list is gone, ids `bench-press`/`incline-bench-press`/`dumbbell-press` no longer exist (breaks any saved workout referencing them, fine pre-launch).
- Two new equipment tags: `smith-machine`, `hammer`.
- `<script setup>` field order standardized across all components (see `CLAUDE.md`): imports → props → emits → router/Nuxt composables (`useHead`, `useI18n`, etc.) → our own Pinia stores → component logic → `defineExpose` → lifecycle hooks.
- `AddSetSheet.vue` is a centered popup instead of a bottom-sheet drawer; autofocuses the weight field on open.
- Exercise-card spacing uses a single `gap` on the list container instead of per-card margin.
- `TheSidebar.vue`: locale buttons moved next to the close icon (circular, matches the color swatches), color-picker row scrolls horizontally with its native scrollbar hidden.

### Fixed

- Leftover debug `console.log`s in `ExercisePicker.vue` removed.

## 2026-08-17

### Added

- Chest catalog expanded to 25 exercises (barbell/dumbbell/Smith-machine variants of flat/incline/decline press, lever crossover, hammer press, pec deck, cable-crossover variants, pullover variants, etc.); two new equipment tags, `smith-machine` and `hammer`.
- New "Cardio" muscle group, 9 exercises: bodyweight/rep-based ones (burpee, mountain climber, battle ropes) plus 6 duration/distance machines (treadmill, stationary bike, stepper, stair climber, elliptical, rowing machine).
- Exercises now log either weight+reps or time+distance, chosen per exercise (`Exercise.trackingType`) — `AddSetSheet.vue` shows the matching pair of fields, `ExerciseCard.vue` shows matching table columns. See `CLAUDE.md` for the full shape.

### Changed

- `workoutStore.addSet`/`updateSet` take a `values` object instead of positional `weight, reps` args.
- PR badge and the add-set popup's "last session" hint don't apply to time-distance exercises (not computed at all, not just hidden).

### Notes

- Chest/Cardio are the only muscle groups filled in with real data so far — the rest still hold the original small placeholder set.

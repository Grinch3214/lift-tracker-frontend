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

- Multi-select in the exercise picker: tapping an exercise toggles selection (highlighted with the accent color, no checkbox) instead of adding it immediately. A sticky "Добавить | N" button appears once at least one is selected and adds all of them to the day in one action. Selection is scoped to the currently open muscle group — going back to the group list or closing the picker clears it.
- Drag-and-drop reordering of exercises within a day: press-and-hold (150ms) anywhere on a card, then drag to reorder — a quick tap still reaches the card's own buttons/sets normally. Order persists via a new `workoutStore.reorderExercises()`. New dependency: `@vueuse/integrations`'s `useSortable` (wraps `sortablejs`) — neither Vant nor the already-installed `@vueuse/core` has a list-reorder primitive.
- The same exercise can now be logged more than once in a single day (e.g. at the start and end of a session) — the picker no longer blocks re-adding an already-logged exercise.

### Changed

- `workoutStore.addExercise` always creates a new `WorkoutExercise` entry instead of merging into an existing one for the same `exerciseId`.
- `workoutStore.getExerciseHistory` now aggregates sets across every same-day entry for an exercise instead of only the first match — needed once the same exercise can appear twice in one day, otherwise a duplicate's sets silently dropped out of history/PR/volume.

### Fixed

- Any action that creates an id (`addExercise`, `addSet`, etc.) crashed with "crypto.randomUUID is not a function" when the app was opened from a phone over LAN by IP (`npm run dev -- --host`, `http://192.168.x.x:3000`) — `crypto.randomUUID()` only exists in secure contexts (HTTPS or `localhost`), so it's undefined over plain HTTP by IP even though `crypto` itself is present. New `app/utils/id.ts#generateId()` falls back to a `crypto.getRandomValues()`-based UUID v4 when `randomUUID` isn't available; all id-generation now goes through it instead of calling `crypto.randomUUID()` directly.
- Opening the "add set" sheet on a real Android phone (over the LAN dev URL) could get its buttons pushed under the on-screen keyboard — the layout viewport wasn't shrinking when the keyboard opened. Added `interactive-widget=resizes-content` to the viewport meta tag (`app/app.vue`) so mobile browsers actually resize the visual viewport instead of overlaying the keyboard on top of fixed-position content.

### Removed

- The per-exercise history popup (opened by tapping an exercise card's title on the Workout page) — removed entirely. It wasn't discoverable as a click target, and long-pressing the title to start a drag-reorder gesture would trigger the browser's native text-selection instead of the drag, fighting with the new drag-and-drop feature. The `/history` tab already covers "see previous progress" at the day level, so nothing replaces this — `docs/02-mvp.md` and `docs/03-roadmap.md` updated to drop the claim.

### Changed

- `AddSetSheet.vue` (add/edit a set) is now a centered popup instead of a bottom-sheet drawer — the bottom-anchored sheet was more exposed to on-screen-keyboard layout issues on real devices; a centered popup reflows more predictably when the keyboard opens.

### Notes

- Two Vue reactivity/vue-i18n gotchas surfaced while building this, both documented in `CLAUDE.md` so they don't get rediscovered: a computed that only reads a property off a nested reactive array (not `.length`/an iteration) won't react to `.push()`/`.splice()` on it — relevant now that `index.vue` needs a writable local copy of the exercise list for `useSortable`; and a literal `|` in a vue-i18n message string is parsed as the plural-form separator even through plain `t()`, which is why the "Добавить | N" button label is composed in the template instead of living in the locale JSON as one string.

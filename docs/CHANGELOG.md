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
- Users can create their own muscle groups and exercises from the exercise picker ("+" next to the close icon — add-group when browsing groups, add-exercise once inside one, with a name, equipment tag, and weight-reps/time-distance choice). Persisted separately from the built-in catalog (`app/stores/catalog.ts`), never touching the static seed data. Custom names are shown as typed, not run through i18n (no translation key exists for them).
- Custom exercises/groups can be edited and deleted — swipe a custom cell in the picker to reveal Edit/Delete. Built-in catalog entries can't be touched (by design, see `CLAUDE.md`). Deleting is a soft-delete: it disappears from the picker but past workouts that used it keep displaying correctly.
- The exercise picker's muscle-group list and each group's exercise list are drag-and-drop reorderable — unlike edit/delete, this covers built-in entries too, not just custom ones (e.g. drag "Ноги" above "Грудь"). Order is stored separately from the entries themselves (`catalogStore.groupOrder`/`exerciseOrder`), since built-in entries have no per-user field to hold a custom position.

### Changed

- `workoutStore.addSet`/`updateSet` take a `values` object instead of positional `weight, reps` args.
- PR badge and the add-set popup's "last session" hint don't apply to time-distance exercises (not computed at all, not just hidden).
- `ExercisePicker.vue` now builds its own header (title + "+" + close) instead of using `van-action-sheet`'s built-in one, to fit the new "+" button; the text "← Назад" link inside a group is now a back-arrow icon in the header instead.
- Exercise cards show a small "☰" icon on the left as a visual hint that they're drag-reorderable — purely a hint, doesn't change the drag target (still the whole card).

### Notes

- Chest/Cardio are the only muscle groups filled in with real data so far — the rest still hold the original small placeholder set.
- "Создание своих упражнений" was explicitly out of MVP scope until now — `docs/02-mvp.md`/`03-roadmap.md` updated to reflect that it's built.

## 2026-08-18

### Added

- Rest timer is now configurable from the sidebar, with 3 mutually exclusive modes: off, auto (existing behavior, now with a configurable duration instead of a fixed 90s), and custom (a permanently visible banner with manual start/pause/reset controls, no auto-start on logging a set). See `CLAUDE.md` for the full behavior breakdown.

### Changed

- Rest timer settings moved out of the sidebar's own body into a dedicated modal, opened via a "Таймер отдыха" menu item — keeps the drawer itself short and leaves room for future menu items.
- Duration is now entered as separate minutes/seconds fields instead of raw seconds, plus ±5s buttons that carry correctly between the two (e.g. `55s + 5s → 1:00`).
- The duration control is shown for both auto and custom modes (previously auto-only) — a custom-mode user no longer has to switch to auto just to change the number, and changing it while idle in custom mode updates the banner immediately instead of requiring a manual reset or page reload.

### Fixed

- The rest-timer settings modal opened pinned to the sidebar's left edge instead of centered on screen — it's a popup nested inside another popup (the sidebar), and Vant's popups center via a permanent CSS `transform`, which makes a non-teleported nested popup center against its transformed ancestor instead of the viewport. Fixed with `teleport="body"`.

## 2026-08-19

### Changed

- "Руки" muscle group replaced with "Бицепс" — 13 curated biceps exercises (barbell/machine/cable/dumbbell curl variants, preacher curl, concentration curl, overhead cable curl, hammer curl, reverse-grip chin-up) replacing the old 6-exercise arms placeholder set (which mixed biceps and triceps movements together). A separate "Трицепс" group is expected once that list is provided.

## 2026-08-21

### Added

- New "Трицепс" muscle group, 14 exercises: close-grip bench press (barbell/Smith machine), lying/seated skull crusher, seated/lying dumbbell extension, single-arm overhead extension, machine extension, overhead cable extension, cable pushdown, dumbbell kickback, triceps dip (bodyweight/machine), bench dip. Catalog is now 8 groups / 83 exercises total.
- Dumbbell exercises now have a ×1/×2 toggle in the add/edit-set popup (defaults to ×2), fixing volume being undercounted for two-dumbbell movements. Weight still means "per dumbbell", so PRs are unaffected — only volume sums (day summary, history list, per-exercise history, the per-set "Vol" column) multiply by the selected count. See `CLAUDE.md` for the full breakdown.
- New "Предплечье" muscle group, 3 exercises: barbell/dumbbell wrist curl, behind-the-back barbell wrist curl. Split out as its own group rather than appended to Biceps, following the same reasoning as the earlier Biceps/Triceps split. Catalog is now 9 groups / 86 exercises total.
- Back catalog filled in for real: 18 exercises (deadlift, bent-over row ×3 equipment variants, T-bar row, one-arm dumbbell row, seated cable/lever row, lat pulldown ×3 grip variants, vertical pulldown machine, straight-arm pulldown, pull-up ×3 grip variants, hyperextension), replacing the old 6-exercise placeholder set. New "Трапеции" muscle group split out of it, 6 shrug variants (barbell/dumbbell/machine/Smith machine, plain and behind-the-back). New equipment tag `t-bar`, added the same way `smith-machine`/`hammer` were earlier — a genuinely distinct piece of gym equipment, not close enough to barbell/machine/cable to reuse an existing tag. Catalog is now 10 groups / 104 exercises total.

## 2026-08-25

### Added

- Rest timer now plays a sound when it reaches 00:00 (auto and custom modes, natural completion only — manual stop/reset stay silent). 8 local bell/notification sounds bundled under `public/sounds/`, selectable via a picker in the rest-timer settings modal (previews audibly as you scroll through options — no separate preview button needed), plus an on/off toggle (default on). Sound files are served from `public/` (not `app/assets/`) since they're referenced dynamically by URL at playback time, not imported by a component.

### Changed

- `settingsStore.restTimerMode` now defaults to `'off'` instead of `'auto'` — the timer got noisier (a sound, not just a silent banner), so it's opt-in from a clean install rather than on by default.

### Fixed

- The sound picker always opened scrolled to the first option, even when a different sound was already selected (e.g. the 5th one) — `van-picker` wasn't told what the current value was. Fixed by binding `:model-value` to the saved `restTimerSoundId`.

### Notes

- Browser audio-autoplay policy requires a real user gesture before `Audio.play()` is reliably allowed, especially on mobile Safari, which additionally ties the unlock to the *specific* `<audio>` element used later. Handled by reusing one `HTMLAudioElement` (`app/stores/ui.ts`), "unlocked" with a muted play+immediate-pause called synchronously from the settings modal's mode-select and sound-toggle click/change handlers — not from a reactive `watch` (those can fire on page load via `{immediate:true}`, which isn't a real gesture).
- Future idea captured in `docs/02-mvp.md` under v1.1: once the app goes PWA, extend this to real Notifications (sound / notification / both) for when the app is backgrounded — not implemented yet, just recorded.

## 2026-08-27

### Changed

- Sidebar's accent-color swatch row replaced with a "Акцентный цвет" menu item at the bottom, opening a picker the same way the rest-timer sound picker works (scroll to preview/apply live, no separate confirm step needed).

## 2026-08-28

### Added

- Shoulders catalog filled in for real: 16 exercises (barbell/machine/Smith/dumbbell seated press variants, Arnold press, lateral raise in 5 variants including two lever-machine ones and a cable one-arm version, front raise with dumbbell and plate, upright row, seated rear-delt raise), replacing the old 5-exercise placeholder set. Catalog is now 10 groups / 115 exercises total.

## 2026-09-04

### Added

- `updatedAt` on custom `MuscleGroup`/`Exercise` entries (stamped on every add/update/delete) and a companion `catalogOrderUpdatedAt` for `groupOrder`/`exerciseOrder` together — groundwork for cloud-sync LWW, matching the backend's wire contracts. First step of v1.3; `Workout.updatedAt` landed earlier (2026-09-02).
- Guest workout counter (`app/stores/guest.ts`, `guestWorkoutCount`/`isGuestLimitReached`) — counts a day as a workout on its first logged set, not on the `Workout` record existing.
- Guest limit UI gate: `GuestLimitGate.vue` swaps the "+" FAB for a banner once the limit is reached, opening `GuestAuthModal.vue` (email/password, register↔login toggle link). Also added a permanent "Войти"/account row to `TheSidebar.vue` (bottom menu) so registration is discoverable well before the 10th workout, not just at the hard block — shows a login menu item when logged out, or truncated email + logout when in. New `app/stores/auth.ts` (`userEmail`/`isAuthenticated`/`logout()`) backs both; `AuthModal.vue#submit()` is still a stub (sets `userEmail` directly, no real request) until the HTTP client lands.
- Proactive "N free workouts left" nudge toast (`GuestRemainingNudge.vue`), shown at remaining-count milestones (8/6/4/2, `GUEST_NUDGE_MILESTONES`) instead of only at the hard limit — auto-hides after 4.5s, tap opens the register modal. `GuestAuthModal` promoted from a per-component local `ref` to global `uiStore.authModal` state now that it has 3 independent openers (limit banner, sidebar login item, nudge toast).
- Real registration/login: `.env`/`.env.example` (`NUXT_PUBLIC_API_BASE_URL`) + `runtimeConfig.public.apiBaseUrl` point the frontend at `lift-tracker-backend`. New `app/utils/api.ts` (`apiFetch`/`ApiError`, thin `$fetch` wrapper) and `app/utils/authApi.ts` (`registerUser`/`loginUser`/`logoutUser`/`restoreSession`) call `POST /auth/register`/`/login`/`/logout`/`/refresh`. `app/stores/auth.ts` now holds a real `refreshToken` (persisted) and `accessToken` (memory-only, re-derived on load by `restoreSession()` from `app.vue`). `AuthModal.vue` shows a loading spinner and status-mapped error text (taken email, wrong credentials, rate limit, validation) instead of the stub it was. Verified end-to-end against the running docker backend with a headless-browser smoke test (register, wrong-password login, logout — zero console errors).

### Fixed

- Guest limit could be bypassed by logging out on a device that had 0 guest workouts logged (e.g. a fresh profile, or one used to log straight into an existing account) — `guestWorkoutCount` only ever grew while actually in guest mode, so a registered user logging out there got a full fresh 10-workout guest allowance instead of being blocked. `authApi.ts#authenticate()` now calls `guestStore.exhaustLimit()` on every successful register/login, maxing the count immediately regardless of its real value — guest mode is retired for good on that device the moment it's ever been signed into.
- `apiFetch`'s `body` option was typed `unknown`, which `$fetch`'s own types reject — narrowed to `Record<string, unknown>` (every call site already only ever passes a plain object).

### Added (cont.)

- Cloud Sync (push/pull), items 1–4 of the v1.3 plan. New `app/stores/sync.ts` (`lastSyncedAt`) and `app/utils/syncApi.ts` (`runFullSync` = push → apply `rejected` → pull → save `serverTime`) wire up `POST /sync/push`/`GET /sync/pull` for all 4 domains (workouts, custom muscle groups, custom exercises, catalog order). `Workout`/`WorkoutExercise`/`SetEntry` go over the wire unchanged (the frontend types already match the backend's contract field-for-field); `MuscleGroup`/`Exercise` get a thin two-way mapper (drops/re-adds `isCustom`, defaults `isDeleted`/`updatedAt`). `apiFetch` gained an `auth: true` option: attaches `Authorization: Bearer <accessToken>`, and on a 401 does one refresh-then-retry via the same `refreshAccessToken()` now shared with `authApi.ts#restoreSession()` (previously two separate implementations of the same exchange). `workoutStore.replaceWorkout()`/`catalogStore.replaceMuscleGroup()`/`replaceExercise()` (upsert-by-id, LWW-guarded by `updatedAt`) and `catalogStore.setCatalogOrder()` are sync's dedicated mutation entry points into those stores. Verified end-to-end against the running docker backend: a locally-seeded guest workout survived register → push → a second, empty browser profile logging into the same account → pull brought it back; same round-trip separately verified for a custom muscle group + exercise + catalog order, including `isCustom: true` correctly restored on pull.

## 2026-09-05

### Changed

- `syncApi.ts#pushLocalData()` now filters workouts/custom muscle groups/custom exercises/catalog order to only what's changed since `lastSyncedAt` before pushing, instead of always sending the entire local dataset. Without this, push size only ever grows — verified via network interception that a re-login with no local changes now sends a `push` body with no `workouts` key at all (just `lastSyncedAt`), instead of resending everything. First-ever sync (empty `lastSyncedAt`) is unaffected — still sends everything, there's nothing to diff against yet.
- Cloud Sync now has background triggers (v1.3 item 5) — `runFullSync()` used to fire only once, right after register/login. `app.vue` now also syncs on `visibilitychange` (both leaving and returning — the primary trigger, `{immediate: true}` so it also covers app boot while already logged in), on reconnect (`useOnline()`), and on a 7-minute backstop timer that only runs while the tab is actually foregrounded (for sessions that never background — e.g. someone watching `WorkoutRestTimer`'s countdown instead of switching apps between sets, where `visibilitychange` alone would never fire). Deliberately NOT wired to individual store mutations — sync granularity is the whole `Workout` (a backend decision), so a per-set trigger would re-send the same growing workout on every single set logged.

### Fixed

- `api.ts#refreshAccessToken()` is now single-flight (concurrent callers share one in-flight promise) — the backend rotates the refresh token on every use, so two callers racing to refresh with the same starting token would have one succeed and one 401 on an already-rotated token, wrongly clearing a still-valid session. Landing multiple independent sync triggers around app boot (alongside `restoreSession()`) made this a real, not just theoretical, risk.
- `syncApi.ts#runFullSync()` is now single-flight too — with login and the new background triggers able to fire close together (e.g. registering right as `visibilitychange` also fires), each independently starting its own push+pull cycle produced interleaved, overlapping `/sync/push`/`/sync/pull` requests (harmless — LWW guards on both ends prevent actual data corruption — but wasteful). Verified: login + two immediate `visibilitychange` events now produce exactly one pull (and no push, since there was nothing local to send), not several.
- Every authenticated request on reload deterministically 401'd once before the reactive retry logic saved it — `accessToken` is memory-only, so it's always null right after a reload, even with a valid `refreshToken` on hand. `apiFetch` now refreshes proactively before ever attempting the request when it can already tell there's no token. Verified via response-status interception: zero 401s on `/sync/*` around a reload, where there used to be one on every single reload while authenticated.
- The proactive fix above made `authApi.ts#restoreSession()` (called from `app.vue`'s `onMounted`, eagerly refreshing on every mount) fully redundant — it was now firing its own separate, independently-timed `POST /auth/refresh` alongside whatever `apiFetch`'s own proactive check was already doing for the sync triggers, producing a visible extra `refresh` call after push/pull instead of before. Removed `restoreSession()` entirely; session restoration now happens in exactly one place (`apiFetch`), exactly when something authenticated is actually attempted. Verified: reload now produces exactly one `/auth/refresh` call (down from two), still followed cleanly by `push`/`pull` with no 401s.
- Manually losing local data independent of a real sync event (clearing `lift-tracker-workouts` in devtools, browser storage eviction, etc.) while auth/`lastSyncedAt` survived looked like the *server* had been wiped — it hadn't (`push` never sends destructive "replace everything" semantics), but an incremental `pull?since=<old lastSyncedAt>` silently returns nothing-new and `lastSyncedAt` still advances, permanently orphaning older server data from every future pull. `syncApi.ts#pullRemoteData()` now detects this (lastSyncedAt set, but workouts/customMuscleGroups/customExercises all empty locally) and forces a full pull instead of an incremental one. Verified: seed a workout → register (pushes it) → delete just `lift-tracker-workouts` locally → reload → the workout comes back.
- Found via the fix above: a workout referencing an `exerciseId` that doesn't resolve to any catalog entry (built-in or custom) crashed the entire app (`index.vue#getExercise()` used a bare `getExerciseById(id)!` non-null assertion) instead of degrading just that one card — a real risk for data arriving via sync (e.g. another device's custom exercise not yet pulled here). Now falls back to a minimal stand-in (`isCustom: true`, name = the raw id) so the page renders normally with the raw id visible instead of a blank error screen.

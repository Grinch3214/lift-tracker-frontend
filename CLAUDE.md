# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

LiftTracker is a workout-logging app whose core goal is **habit retention**, not just set-tracking — see `docs/00-vision.md` and `docs/01-product-discovery.md` for the product framing (target user: someone who keeps quitting the gym). `docs/02-mvp.md` is the source of truth for current scope; `docs/03-roadmap.md` tracks milestones; `docs/CHANGELOG.md` has a dated log of what was actually built.

The project was rebuilt from scratch on 2026-08-03 on a new stack. An earlier Vue3+Vant SPA + NestJS/Prisma backend existed and was deleted in commit `f13d79b "Remove old project"` — it's readable via `git show f13d79b^:frontend/...` / `f13d79b^:backend/...` if you need prior-art reference, but it is **not** the current architecture.

## Commands

```bash
npm run dev       # Nuxt dev server (localhost:3000)
npm run build     # production build
npm run generate  # static generation
npm run preview   # preview a production build
```

No test suite yet — there is no automated correctness gate. Verify changes by running the app.

## Architecture

**Stack:** Nuxt 4 + TypeScript + Pinia (`@pinia/nuxt`) + Vant 4 (`@vant/nuxt`) + VueUse (`@vueuse/nuxt`) + `@nuxtjs/i18n` + SCSS. Drag-and-drop reordering uses `@vueuse/integrations`'s `useSortable` (wraps `sortablejs`) — neither Vant nor `@vueuse/core` has a list-reorder primitive.

**No backend.** Everything lives in the browser. All persistence is `localStorage` via VueUse's `useStorage`, wrapped inside Pinia stores.

**`ssr: false` in `nuxt.config.ts` is load-bearing, don't remove without fixing the underlying issue first.** With SSR on, the server renders with an empty store (no `localStorage` on the server), and Pinia/Nuxt hydration overwrites the client's already-hydrated `useStorage` state with that empty server snapshot on every page load — `useStorage`'s watcher then persists the emptiness back into `localStorage`, silently wiping saved workouts on refresh. Since this app has no server-rendered content to gain from SSR anyway, keeping it off is the correct fix, not a workaround.

**TypeScript:** Nuxt's generated tsconfig enables `noUncheckedIndexedAccess: true` — array index access (including array destructuring, e.g. `const [a] = arr`) types as `T | undefined`. Don't work around it by disabling the flag; narrow/guard instead (see `app/utils/date.ts#parseDate`).

**Path aliases:** `@/*` → `app/*` (Nuxt default). `~~/*` / `@@/*` → repo root — used for `types/*` since `types/` lives outside `app/` (e.g. `import type { Workout } from '~~/types'`).

**Accent color is one CSS variable, not per-component props.** `settingsStore.primaryColor` (`app/stores/settings.ts`) holds bare "R G B" channels (e.g. `"60 142 224"`, no `rgb()` wrapper, no commas), persisted via `useStorage`. `app/app.vue` watches it and sets two `document.documentElement` custom properties: `--van-primary-color` (`rgb(R G B)`, a complete color — Vant's own component CSS reads this directly, e.g. `.van-button--primary { background: var(--van-primary-color) }`, so it must never be just bare channels) and `--van-primary-color-channels` (the bare channels themselves, for spots that need a translucent variant: `rgb(var(--van-primary-color-channels) / 40%)`). Don't reintroduce a hardcoded color literal anywhere — pull from one of these two variables, or from `settingsStore.primaryColorCss` (the `rgb(...)`-wrapped computed, for places that need a full color as a JS value, e.g. a `van-calendar :color` prop).

**Styling convention: BEM + SCSS nesting, scoped by default.** Every component's `<style scoped>` is one root block class matching the component's role (e.g. `.exercise-card`, `.sidebar`), with `&__element` for its parts and bare `&.modifier`-style classes for state (`is-pr`, `active` — not `&--modifier`). Single-edge physical properties (`margin-bottom`, `border-top`, positioned `bottom`/`right`, etc.) are written as logical properties (`margin-block-end`, `border-block-start`, `inset-inline-end`) instead; multi-value shorthands (`padding: 14px 14px 10px`) are left physical. Global SCSS (`app/assets/scss/`) is reserved for things that don't belong to one component: reset, design tokens (`_varibles.scss`), mixins, and the rare utility class that's genuinely identical (not just similar) across components with zero per-usage overrides — e.g. `.dot`, the "·" stat separator. If you're tempted to add component-shaped CSS (a block with its own look) to a global file instead of the component's own `scoped` style, don't — that's what `scoped` exists to avoid re-litigating.

**`<script setup>` structure — fixed top-to-bottom order in every component:**
1. Imports — only what Nuxt doesn't auto-import (Vue reactivity APIs like `ref`/`computed`/`watch`/`onMounted`, and `useXStore`/`useI18n`/`useRoute` etc. are auto-imported; don't add explicit imports for them).
2. `defineProps<...>()`
3. `defineEmits<...>()`
4. Router / Nuxt & module composables — `useRoute()`, `useRouter()`, `useHead()`, `useSeoMeta()`, `useI18n()`, etc. (anything framework/module-provided, not ours)
5. Stores — `useXStore()` (our own Pinia stores only)
6. Component logic — refs, computed, functions, `watch(...)`, roughly in that order; a short comment banner ahead of each distinct logical group is fine, but don't force one for a single line
7. `defineExpose(...)`
8. Lifecycle hooks — `onMounted`, etc.

Skip sections that don't apply (most components have no props/emits/router/expose) rather than leaving an empty placeholder.

## Data flow

```
types/*.ts                 ← shared interfaces: MuscleGroup, Exercise, Workout, WorkoutExercise, SetEntry, EquipmentType
                              all ids are string, generated via app/utils/id.ts#generateId() at creation time

app/utils/id.ts             ← generateId() — crypto.randomUUID() when available, otherwise a
                              crypto.getRandomValues()-based UUID v4 fallback. Needed because randomUUID() only
                              exists in secure contexts (HTTPS/localhost); opening the dev server from a phone
                              over plain HTTP by LAN IP (`--host`) is not secure, so it's undefined there even
                              though `crypto` itself exists — throws "crypto.randomUUID is not a function" at
                              the first id-generating action. Always use this helper, never call
                              crypto.randomUUID() directly.

app/data/muscle-groups.ts  ← static seed data: 6 muscle groups, ~35 exercises (id, name, muscleGroupId, equipment).
                              `name` here is an English dev fallback only — never rendered directly, see i18n below.
app/utils/exercises.ts     ← lookups over the static catalog: getExerciseById, getMuscleGroupById, getExercisesByMuscleGroup
app/utils/date.ts          ← formatDate/parseDate ('YYYY-MM-DD' string <-> Date), isToday, formatDateLabel/formatWeekdayLabel (locale-aware, take a locale string), addDays
app/utils/format.ts        ← isBodyweight(weight) — the "kg"/"BW" text itself comes from translations, not from this util
app/utils/pluralize.ts     ← pluralize(count, {one, few, many}) — Russian has 3 plural forms, not 2; see i18n below

app/stores/workout.ts      ← THE store. workouts: Workout[] persisted via useStorage('lift-tracker-workouts').
                              One Workout per date (getOrCreateWorkoutByDate enforces this). CRUD: addExercise
                              (always creates a new WorkoutExercise, even if that exerciseId is already logged
                              that day — intentional, e.g. same exercise at the start and end of a session),
                              removeExercise, reorderExercises(date, orderedIds) (persists drag-and-drop order,
                              re-syncs WorkoutExercise.order to match), addSet, updateSet, removeSet. Also
                              getExerciseHistory(exerciseId) (aggregates sets across ALL same-day entries for
                              that exerciseId, not just the first match — matters now that duplicates exist)
                              and getPersonalRecord(exerciseId) — used for the PR badge and the "last session"
                              hint in the add-set popup.
app/stores/ui.ts           ← UI-only state, not persisted: selectedDate (drives which day is shown on Workout page),
                              addSetSheet (add/edit-set popup state — the name is historical, it's rendered
                              as a centered popup now, not a bottom sheet), exercisePicker (show flag),
                              restTimer (90s countdown + start/stop)
app/stores/settings.ts     ← persisted user preferences (currently just primaryColor). Also exports colorPresets
                              (plain const, not store state) — the 7 selectable accent-color options.
```

Workouts only store `exerciseId` (a string pointing into the static catalog), never exercise name/equipment directly — components resolve display data via `getExerciseById`.

## Pages / component tree

```
app/layouts/default.vue           ← van-config-provider(dark) + TheHeader + <slot> + TheFooter + FAB ("+")
                                     + global popups: WorkoutExercisePicker, WorkoutAddSetSheet
  app/components/the/TheHeader.vue   ← nav bar; burger icon (left) opens TheSidebar; title is clickable
                                        (goes home + resets to today); van-calendar (show-confirm:false →
                                        closes on single tap), dots on dates that have a workout
  app/components/the/TheSidebar.vue  ← left-side van-popup drawer: header row (EN/RU circular locale
                                        buttons, left — generated from useI18n().locales, sized/shaped to
                                        match the color swatches on purpose, for future flag-icon swap-in;
                                        close icon, right), empty menu-list placeholder (commented v-for
                                        scaffold), accent-color swatches (bottom, horizontally scrollable —
                                        native scrollbar hidden via scrollbar-width/::-webkit-scrollbar)
  app/components/the/TheFooter.vue   ← 2-tab bottom nav (Workout / History), route-driven

  app/pages/index.vue ("/")          ← Workout page for ui.selectedDate; swipe left/right (useSwipe) moves
                                        ui.selectedDate ±1 day, with a direction-aware Transition (slide+fade)
                                        keyed on the date so the animation direction matches the swipe.
                                        Exercise cards are drag-reorderable (useSortable, whole card is the
                                        drag target, delayOnTouchOnly so a quick tap still reaches buttons/sets
                                        underneath) — see the reactivity gotcha below before touching this.
    WorkoutRestTimer                    ← rest banner, only visible while ui.restTimer.active
    WorkoutExerciseCard (per exercise)  ← sets table, PR badge, add/edit/delete set, delete exercise
    WorkoutEmptyState                   ← shown when the selected day has no exercises yet

  app/pages/history.vue ("/history") ← all workouts, sorted newest-first
    HistoryWorkoutListItem (per workout) ← tap sets ui.selectedDate + navigates to "/"
```

`app/app.vue` also syncs Vant's own component locale (`en-US`/`ru-RU`) to the active app language via a `watch(locale, ...)` — this lives in `app.vue`'s `<script setup>`, not a plugin (see i18n section for why).

Global popups (`WorkoutExercisePicker`, `WorkoutAddSetSheet`) are mounted once in the layout, not per-page, and are driven entirely by `ui` store state — components anywhere just flip `uiStore.exercisePicker.show` or `uiStore.addSetSheet = {...}` to open them. `TheSidebar` is different: only `TheHeader` can open it (nothing else needs to), so its `show` state is a local `ref` in `TheHeader.vue` passed down via `v-model:show`, not `ui` store state.

**There is no per-exercise history view.** It existed briefly (tap the exercise card's title on the Workout page) but was removed — it wasn't discoverable (the click target wasn't obvious as interactive) and it also fought with drag-reorder: long-pressing text to start a drag would trigger the browser's native text-selection instead. The `/history` tab covers this need at the day level. Don't reintroduce a click handler on `.exercise-card__name`/`ExerciseCard.vue`'s title without solving both problems again.

**Vant's `showConfirmDialog` rejects its promise when the user cancels.** `removeSet`/`removeExercise` in `index.vue` both `await` it — wrap in try/catch (return on catch) or cancelling throws an unhandled rejection in the console. Any new destructive-action confirmation should follow the same try/catch shape.

**PR badge is per-set-id, not per-weight.** `ExerciseCard.vue`'s `isPR`/`prSetId` must flag only the *last* set that reaches the record weight, never every tied set.

**A computed that only reads a property (not `.length`/an iteration) on a nested reactive array won't react to `.push()`/`.splice()` on it.** `workoutStore.getWorkoutByDate(date)?.exercises` is a plain property read — Vue tracks "did `.exercises` get reassigned", not "did its contents change". `index.vue`'s `storedExercises` computed spreads it (`[...workout.exercises]`) specifically to force the iteration that makes push/splice mutations (e.g. `addExercise`) actually invalidate it. This bit only in a scenario with an intermediate `ref` feeding `useSortable` (see below) — a bare `v-for="we in exercises"` directly over a computed doesn't need this, because `v-for`'s own iteration during render establishes the same tracking implicitly.

**`useSortable`'s target element gets destroyed/recreated on every date swipe** (`.workout-page__list` sits inside a `:key="currentDate"` Transition). Pass `watchElement: true` or the Sortable instance keeps pointing at a detached node after the first swipe and dragging silently stops working. Persisting the reorder goes through an explicit `workoutStore.reorderExercises()` call in a `watch`, not by letting `useSortable` own the store's array directly — same "mutations go through named store actions" rule as everywhere else in this app.

## Internationalization (i18n)

English + Russian via `@nuxtjs/i18n`. This is a permanent architecture decision, not a stopgap — see `docs/00-vision.md` for the "why translations live on the frontend forever" reasoning (short version: offline-first app, no backend to serve them from, and even the future cloud-sync backend won't own UI copy).

- `i18n/locales/en.json`, `i18n/locales/ru.json` — all translatable strings, namespaced by feature (`workout.*`, `addSetSheet.*`, `exercisePicker.*`, `history.*`, `restTimer.*`, `units.*`, `calendar.*`) plus `catalog.muscleGroups.<id>` / `catalog.exercises.<id>` for the exercise catalog, keyed by the same ids used in `app/data/muscle-groups.ts`.
- `strategy: 'no_prefix'` in `nuxt.config.ts` — no `/ru/...` URL prefixes, locale is cookie-only (`lift-tracker-locale`). Fine given `ssr: false` and no SEO need.
- Language switcher: EN/RU buttons in `TheSidebar.vue` (burger menu), generated from `useI18n().locales`, call `setLocale()`.
- **Pluralization is hand-rolled, not vue-i18n's built-in plural syntax.** Russian has 3 plural forms (1 / 2-4 / 5+), not the 2 vue-i18n's default English-style plural rule assumes. Pattern: locale files have `xWordOne`/`xWordFew`/`xWordMany` string keys, `app/utils/pluralize.ts#pluralize(count, {one, few, many})` picks the right one, then interpolate into `units.countWord` (`"{count} {word}"`). See `app/pages/index.vue`'s `summaryText` for the canonical example.
- **Don't use `tm()` for plain string arrays** — in this Nuxt/vue-i18n setup `tm()` returns compiled message AST nodes, not evaluated strings (you'd need `rt()` to render them). That's why plural forms are separate string keys resolved via plain `t()`, not a `tm()`-fetched array — simpler and avoids that footgun entirely.
- **`useI18n()` cannot be called inside a `defineNuxtPlugin()` callback in this setup.** Global i18n-dependent logic (e.g. the Vant locale sync) belongs in `app/app.vue`'s `<script setup>` instead, which has a guaranteed valid Vue composition context.
- Catalog display names are never read from `app/data/muscle-groups.ts#name` — always resolve via `t(\`catalog.exercises.${id}\`)` / `t(\`catalog.muscleGroups.${id}\`)`. The `name` field there is an English fallback for dev/debug convenience only.
- **A literal `|` inside a message string is vue-i18n's plural-form separator, even via plain `t()` with no explicit plural syntax intended.** If the params include a `count` key, vue-i18n uses it to pick which side of the `|` to render — silently mangling any string where `|` was meant as a literal visual separator (e.g. an attempted `"Добавить | {count}"` key rendered as just `"Добавить"` or just the bare count depending on its value). Build that kind of "label | number" string by concatenating in the template/script instead of putting `|` in the locale JSON.

## MVP scope

Per `docs/02-mvp.md`, currently implemented: start a workout, add exercises, log sets, view history, view per-exercise history — all without registration, all local-only.

**Explicitly out of scope right now** (don't add unless the user asks and updates the docs first): Templates / prebuilt programs, a separate "Progress" tab browsing by muscle group, custom exercise creation, achievements, AI, social features, subscriptions, registration/cloud sync.

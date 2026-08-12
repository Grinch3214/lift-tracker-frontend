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

**Stack:** Nuxt 4 + TypeScript + Pinia (`@pinia/nuxt`) + Vant 4 (`@vant/nuxt`) + VueUse (`@vueuse/nuxt`) + `@nuxtjs/i18n` + SCSS.

**No backend.** Everything lives in the browser. All persistence is `localStorage` via VueUse's `useStorage`, wrapped inside Pinia stores.

**`ssr: false` in `nuxt.config.ts` is load-bearing, don't remove without fixing the underlying issue first.** With SSR on, the server renders with an empty store (no `localStorage` on the server), and Pinia/Nuxt hydration overwrites the client's already-hydrated `useStorage` state with that empty server snapshot on every page load — `useStorage`'s watcher then persists the emptiness back into `localStorage`, silently wiping saved workouts on refresh. Since this app has no server-rendered content to gain from SSR anyway, keeping it off is the correct fix, not a workaround.

**TypeScript:** Nuxt's generated tsconfig enables `noUncheckedIndexedAccess: true` — array index access (including array destructuring, e.g. `const [a] = arr`) types as `T | undefined`. Don't work around it by disabling the flag; narrow/guard instead (see `app/utils/date.ts#parseDate`).

**Path aliases:** `@/*` → `app/*` (Nuxt default). `~~/*` / `@@/*` → repo root — used for `types/*` since `types/` lives outside `app/` (e.g. `import type { Workout } from '~~/types'`).

## Data flow

```
types/*.ts                 ← shared interfaces: MuscleGroup, Exercise, Workout, WorkoutExercise, SetEntry, EquipmentType
                              all ids are string (crypto.randomUUID() at creation time)

app/data/muscle-groups.ts  ← static seed data: 6 muscle groups, ~35 exercises (id, name, muscleGroupId, equipment).
                              `name` here is an English dev fallback only — never rendered directly, see i18n below.
app/utils/exercises.ts     ← lookups over the static catalog: getExerciseById, getMuscleGroupById, getExercisesByMuscleGroup
app/utils/date.ts          ← formatDate/parseDate ('YYYY-MM-DD' string <-> Date), isToday, formatDateLabel/formatWeekdayLabel (locale-aware, take a locale string), addDays
app/utils/format.ts        ← isBodyweight(weight) — the "kg"/"BW" text itself comes from translations, not from this util
app/utils/pluralize.ts     ← pluralize(count, {one, few, many}) — Russian has 3 plural forms, not 2; see i18n below

app/stores/workout.ts      ← THE store. workouts: Workout[] persisted via useStorage('lift-tracker-workouts').
                              One Workout per date (getOrCreateWorkoutByDate enforces this). CRUD: addExercise,
                              removeExercise, addSet, updateSet, removeSet. Also getExerciseHistory(exerciseId)
                              and getPersonalRecord(exerciseId) — used for the PR badge and the history popup.
app/stores/ui.ts           ← UI-only state, not persisted: selectedDate (drives which day is shown on Workout page),
                              addSetSheet (bottom-sheet state), exercisePicker (show flag), historyExerciseId
                              (which exercise's history popup is open), restTimer (90s countdown + start/stop)
```

Workouts only store `exerciseId` (a string pointing into the static catalog), never exercise name/equipment directly — components resolve display data via `getExerciseById`.

## Pages / component tree

```
app/layouts/default.vue           ← van-config-provider(dark) + TheHeader + <slot> + TheFooter + FAB ("+")
                                     + global popups: WorkoutExercisePicker, WorkoutAddSetSheet, HistoryExerciseHistoryModal
  app/components/the/TheHeader.vue   ← nav bar; van-calendar (show-confirm:false → closes on single tap),
                                        dots on dates that have a workout
  app/components/the/TheFooter.vue   ← 2-tab bottom nav (Workout / History), route-driven

  app/pages/index.vue ("/")          ← Workout page for ui.selectedDate; swipe left/right (useSwipe) moves
                                        ui.selectedDate ±1 day, with a direction-aware Transition (slide+fade)
                                        keyed on the date so the animation direction matches the swipe
    WorkoutRestTimer                    ← rest banner, only visible while ui.restTimer.active
    WorkoutExerciseCard (per exercise)  ← sets table, PR badge, add/edit/delete set, delete exercise
    WorkoutEmptyState                   ← shown when the selected day has no exercises yet

  app/pages/history.vue ("/history") ← all workouts, sorted newest-first
    HistoryWorkoutListItem (per workout) ← tap sets ui.selectedDate + navigates to "/"
```

`app/app.vue` also syncs Vant's own component locale (`en-US`/`ru-RU`) to the active app language via a `watch(locale, ...)` — this lives in `app.vue`'s `<script setup>`, not a plugin (see i18n section for why).

Global popups (`WorkoutExercisePicker`, `WorkoutAddSetSheet`, `HistoryExerciseHistoryModal`) are mounted once in the layout, not per-page, and are driven entirely by `ui` store state — components anywhere just flip `uiStore.exercisePicker.show`, `uiStore.addSetSheet = {...}`, or `uiStore.historyExerciseId` to open them.

**Vant's `showConfirmDialog` rejects its promise when the user cancels.** `removeSet`/`removeExercise` in `index.vue` both `await` it — wrap in try/catch (return on catch) or cancelling throws an unhandled rejection in the console. Any new destructive-action confirmation should follow the same try/catch shape.

**PR badge is per-set-id, not per-weight.** `ExerciseCard.vue`'s `isPR`/`prSetId` must flag only the *last* set that reaches the record weight, never every tied set.

## Internationalization (i18n)

English + Russian via `@nuxtjs/i18n`. This is a permanent architecture decision, not a stopgap — see `docs/00-vision.md` for the "why translations live on the frontend forever" reasoning (short version: offline-first app, no backend to serve them from, and even the future cloud-sync backend won't own UI copy).

- `i18n/locales/en.json`, `i18n/locales/ru.json` — all translatable strings, namespaced by feature (`workout.*`, `addSetSheet.*`, `exercisePicker.*`, `history.*`, `exerciseHistory.*`, `restTimer.*`, `units.*`, `calendar.*`) plus `catalog.muscleGroups.<id>` / `catalog.exercises.<id>` for the exercise catalog, keyed by the same ids used in `app/data/muscle-groups.ts`.
- `strategy: 'no_prefix'` in `nuxt.config.ts` — no `/ru/...` URL prefixes, locale is cookie-only (`lift-tracker-locale`). Fine given `ssr: false` and no SEO need.
- Language switcher: `left-text` on the nav-bar in `TheHeader.vue`, toggles `setLocale()`.
- **Pluralization is hand-rolled, not vue-i18n's built-in plural syntax.** Russian has 3 plural forms (1 / 2-4 / 5+), not the 2 vue-i18n's default English-style plural rule assumes. Pattern: locale files have `xWordOne`/`xWordFew`/`xWordMany` string keys, `app/utils/pluralize.ts#pluralize(count, {one, few, many})` picks the right one, then interpolate into `units.countWord` (`"{count} {word}"`). See `app/pages/index.vue`'s `summaryText` for the canonical example.
- **Don't use `tm()` for plain string arrays** — in this Nuxt/vue-i18n setup `tm()` returns compiled message AST nodes, not evaluated strings (you'd need `rt()` to render them). That's why plural forms are separate string keys resolved via plain `t()`, not a `tm()`-fetched array — simpler and avoids that footgun entirely.
- **`useI18n()` cannot be called inside a `defineNuxtPlugin()` callback in this setup.** Global i18n-dependent logic (e.g. the Vant locale sync) belongs in `app/app.vue`'s `<script setup>` instead, which has a guaranteed valid Vue composition context.
- Catalog display names are never read from `app/data/muscle-groups.ts#name` — always resolve via `t(\`catalog.exercises.${id}\`)` / `t(\`catalog.muscleGroups.${id}\`)`. The `name` field there is an English fallback for dev/debug convenience only.

## MVP scope

Per `docs/02-mvp.md`, currently implemented: start a workout, add exercises, log sets, view history, view per-exercise history — all without registration, all local-only.

**Explicitly out of scope right now** (don't add unless the user asks and updates the docs first): Templates / prebuilt programs, a separate "Progress" tab browsing by muscle group, custom exercise creation, achievements, AI, social features, subscriptions, registration/cloud sync.

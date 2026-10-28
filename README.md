# ACL tracker

A personal rehab log for an evolving ACL programme. Use it on the gym floor to see the next warm-up or lift, log weight and reps, and keep a history as the prescription changes.

## What it does

- Password gate (one shared password stored as a Worker secret)
- Active programme with warm-ups and working lifts
- In-session logging: type the kg and reps you actually did, see the live set list, add extra sets, undo a mistype, and alternate left/right on bilateral lifts
- Matching line plates for each lift, reused on Today, the session screen, History, and the programme editor
- Last-used weight and reps prefilled, with the previous session’s sets shown on each lift card
- Left is the ACL side; bilateral lifts label it
- 48-hour gap and twice-weekly frequency on the home screen
- Programme editor so exercises, targets, and notes can change over time

## Stack

Next.js App Router on Cloudflare Workers (via OpenNext), Worker `fitness-app` on George's personal Cloudflare account. Data lives in the D1 database `fitness-app`, bound to the Worker as `DB`. All database access is server-only (`lib/data.ts`).

## First-time setup

1. Create the database and its tables: `npx wrangler d1 create fitness-app`, put its id in `wrangler.jsonc`, then `npx wrangler d1 migrations apply fitness-app --remote`.
2. Add these as Worker secrets (`npx wrangler secret put NAME`) and locally in `.env.local`:

```
APP_PASSWORD=choose-a-password
SESSION_SECRET=at-least-16-random-characters
```

`SESSION_SECRET` can be generated with `openssl rand -base64 32`.

3. Run `npm run deploy`, open the URL, log in, start a session.

## Programme changes

Add a new numbered SQL file to `migrations/` with fixed UUIDs, then apply it with `npx wrangler d1 migrations apply fitness-app --remote` (and `--local` for development).

Local development:

```bash
cp .env.example .env.local
npm install
npx wrangler d1 migrations apply fitness-app --local
npm run dev
```

`npm run dev` uses a local copy of the D1 database, so it starts empty apart from what the migrations add.

## Tests

```bash
npm test
```

Covers the password gate, session-token signing, last-weight prefill, workout stepper (warm-up → left/right alternating → done), and the 48-hour / weekly frequency helper.

## Optional post-session extras

After completing any programme (including ending early), record body weight in kg,
extra assault-bike minutes, and sauna minutes. All are optional. Reopen a completed
session to edit or remove entries; History shows them separately from the programme.
Weight defaults to the most recent earlier session with a weigh-in, or 96 kg until
one has been recorded. The default is only saved when you select **Save extras**.

The table comes from `migrations/0002_post_session_logs.sql`.

The separate `post_session_logs` model stores one optional weight and a list of
activities per session. To add another timed activity, add its key, display name
and description to `POST_SESSION_ACTIVITIES` in `lib/post-session.ts`. The form and
validation use that list; no programme edits or new database columns are needed.

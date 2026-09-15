# ACL tracker

A personal rehab log for an evolving ACL programme. Use it on the gym floor to see the next warm-up or lift, log weight and reps, and keep a history as the prescription changes.

## What it does

- Password gate (one shared password stored in Vercel)
- Active programme with warm-ups and working lifts
- In-session logging: type the kg and reps you actually did, see the live set list, add extra sets, undo a mistype, and alternate left/right on bilateral lifts
- Matching line plates for each lift, reused on Today, the session screen, History, and the programme editor
- Last-used weight and reps prefilled, with the previous session’s sets shown on each lift card
- Left is the ACL side; bilateral lifts label it
- 48-hour gap and twice-weekly frequency on the home screen
- Programme editor so exercises, targets, and notes can change over time

## Stack

Next.js App Router on Vercel. Supabase Postgres for data. All database access is server-only with the service role key. Row Level Security is on and `anon` / `authenticated` have no table rights.

## First-time setup

1. Create a [Supabase](https://supabase.com) project.
2. Open the SQL editor and paste [`supabase/setup.sql`](supabase/setup.sql). That creates the tables, locks the Data API, and seeds the current ACL programme.
3. Create a Vercel project from this GitHub repo.
4. Add these environment variables in Vercel (and locally in `.env.local`):

```
APP_PASSWORD=choose-a-password
SESSION_SECRET=at-least-16-random-characters
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret
```

`SESSION_SECRET` can be generated with `openssl rand -base64 32`.

`SUPABASE_SERVICE_ROLE_KEY` must be the **secret / service_role** key from Supabase → Project Settings → API. The publishable/anon key cannot read these tables (RLS is on and `anon` has no grants). Do not prefix it with `NEXT_PUBLIC_`.

5. Deploy, open the URL, log in, start a session.

Local development:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Login works without Supabase. The home screen will ask you to connect the database until the Supabase variables are set.

## Tests

```bash
npm test
```

Covers the password gate, session-token signing, last-weight prefill, workout stepper (warm-up → left/right alternating → done), and the 48-hour / weekly frequency helper.

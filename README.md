# ACL tracker

A personal rehab log for an evolving ACL programme. Use it on the gym floor to see the next warm-up or lift, log weight and reps, and keep a history as the prescription changes.

## What it does

- Password gate (one shared password stored in Vercel)
- Active programme with warm-ups and working lifts
- In-session stepper: warm-up checkboxes, then one set at a time, both sides when required
- Last-used weight and reps prefilled for the next session
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
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SESSION_SECRET` can be generated with `openssl rand -base64 32`. The service role key stays on the server. Do not prefix it with `NEXT_PUBLIC_`.

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

Covers the password gate, session-token signing, last-weight prefill, workout stepper (warm-up → left → right → done), and the 48-hour / weekly frequency helper.

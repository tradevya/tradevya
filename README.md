# Tradevya

Tradevya is a workplace shift marketplace for airline and airport employees. It replaces shift group texts with a verified web app for posting, requesting, and approving shift changes inside the correct company, airport, and station.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- Vercel-ready deployment

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

3. In Supabase, run the SQL files in this order:

```bash
supabase/migrations/001_tradevya_schema.sql
supabase/seed/001_seed_directory.sql
```

4. Start the app:

```bash
npm run dev
```

## Phase 1 Included

- Work-email-only signup validation
- Supabase email verification gate
- Company, airport, and station selection
- Profile table and protected access model
- Station-scoped All Posts feed
- Category and day-of-week multi-select filters
- Create shift post page
- Shift post detail page
- Shift request submission
- Poster approve and decline flow
- In-app notifications
- Location change request flow

## Security Notes

- Do not commit passwords or Supabase service-role keys.
- User passwords are never stored in source, `.env`, seed files, or README files.
- Personal email domains are blocked both in the app and by a Supabase Auth trigger.
- Supabase Row Level Security scopes shift posts to a user's station.

## Phase 2 Scaffolded

The database and protected routes are prepared for Airport Board, Teams, Flight Alert placeholders, and Admin Moderation. No paid API or cloud file storage is connected.

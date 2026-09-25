# CannaDry

Wholesale cannabis platform for Health Canada licence holders. CannaDry is the single seller; verified licence-holder companies buy by purchase order. See `PLAN.md` for scope and progress.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, row-level security) · Resend (email)

## Local setup

Requirements: Node 20+, Docker.

```bash
npm install
npm run db:start            # starts local Supabase and applies migrations
cp .env.example .env.local  # fill in keys printed by `npx supabase status`
npm run create-admin -- admin@example.com 'a-long-password' "Your Name"
npm run dev
```

Useful scripts:

| Script | What it does |
|---|---|
| `npm run db:reset` | Recreate the local database from `supabase/migrations` |
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` after a schema change |
| `npm run create-admin` | Create or promote a CannaDry staff account |
| `npm run lint` / `npm run typecheck` | Checks |

Without `RESEND_API_KEY`, emails are printed to the server log.

## How access works

- Everything is behind a 19+ age gate (`src/proxy.ts`).
- Visitors see only public pages. Products, prices and COAs require an **approved** company.
- Access rules are enforced in Postgres with row-level security (`supabase/migrations`), not only in the UI.
- Account reviews and status changes run through database functions that write the append-only `audit_log`.
- All storage buckets are private; files are served through short-lived signed URLs.

## Production checklist

- Create the Supabase project in **Canada (Central)** for data residency.
- Auth settings: enable email confirmation; set Site URL and redirect URL `https://<domain>/auth/confirm`.
- Set the environment variables from `.env.example` in Vercel.
- Replace placeholders in `src/lib/site.ts` (licence number, legal name, contact details).
- Have counsel review `/privacy` and `/terms`.

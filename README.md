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
npm run seed                # fake test data (see accounts below)
npm run dev
```

Useful scripts:

| Script | What it does |
|---|---|
| `npm run db:reset` | Recreate the local database from `supabase/migrations` |
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` after a schema change |
| `npm run seed` | Load fake producers, products, lots with sample COAs, buyers and orders (local only) |
| `npm run create-admin` | Create or promote a CannaDry staff account |
| `npm run lint` / `npm run typecheck` | Checks |

Test accounts after `npm run seed` (password `Test-pass-2026`): `admin@cannadry.example` (staff), `buyer@fogline.example` and `buyer@harbourview.example` (approved buyers), `buyer@kettlevalley.example` (pending).

Without `RESEND_API_KEY`, emails are printed to the server log.

## How access works

- Everything is behind a 19+ age gate (`src/proxy.ts`).
- Visitors see only public pages. Products, prices and COAs require an **approved** company.
- Access rules are enforced in Postgres with row-level security (`supabase/migrations`), not only in the UI.
- Account reviews and status changes run through database functions that write the append-only `audit_log`.
- All storage buckets are private; files are served through short-lived signed URLs.

## Deploying

1. **Supabase**: create a project in the **Canada (Central)** region. Then, from this folder:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push          # applies supabase/migrations
   ```
   In the dashboard: Authentication → turn on email confirmation; URL configuration → Site URL `https://<domain>`, redirect URL `https://<domain>/auth/confirm`.
2. **Staff account**: put the production keys in `.env.local` temporarily and run
   `npm run create-admin -- you@yourdomain.ca 'long-password' "Your Name"`. Do **not** run `npm run seed` in production.
3. **Vercel**: import the GitHub repository, set the variables from `.env.example`
   (`NEXT_PUBLIC_SITE_URL` = your domain) and deploy.
4. **Resend**: verify your sending domain, then set `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`.
5. In the admin, add real producers (with licence numbers), categories and products, each with lots and COAs.

## Production checklist

See `COMPLIANCE.md` for the full compliance check.

- Create the Supabase project in **Canada (Central)** for data residency.
- Auth settings: enable email confirmation; set Site URL and redirect URL `https://<domain>/auth/confirm`.
- Set the environment variables from `.env.example` in Vercel.
- Replace placeholders in `src/lib/site.ts` (licence number, legal name, contact details).
- Have counsel review `/privacy` and `/terms`.

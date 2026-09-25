# CannaDry — Compliance check (Phase 1)

Checked on 2026-09-25 against section 5 of the brief, page by page, on the local build with seed data.
Automated checks: `npm run check:a11y` (axe-core, WCAG 2.1 A/AA, desktop 1280 px and mobile 390 px) and scripted access tests.

## Summary

| # | Rule | Status | How it is enforced |
|---|---|---|---|
| 1 | Products and prices only for approved, verified licence holders | ✅ | Row-level security in Postgres: catalogue tables readable only when the user's company is `approved`. Anonymous role has no table access. Pages also redirect (`/login`, `/pending`). Tested: visitor, pending and other-company access all blocked (404/redirect). |
| 2 | 19+ age gate on the public site | ✅ | `src/proxy.ts` redirects every page to `/age-check` until confirmed (30-day cookie). Tested on public and private paths. |
| 3 | No lifestyle imagery, nothing appealing to young people | ✅ | No photographs or `<img>` on the site. Only an original mountain-ridge drawing and neutral text tiles for products. Muted palette, no cartoons, mascots, celebrities or candy colours. Seed edibles are plain (dark chocolate, herbal tea). |
| 4 | No health or therapeutic claims | ✅ | Site copy reviewed and scanned. Admin product form rejects claim words (e.g. "relieves", "sleep aid", "pain") in names and descriptions. Product info is factual: cannabinoids, terpenes, format, dates. |
| 5 | No testimonials or reviews about effects | ✅ | No reviews, ratings or testimonials exist anywhere in the product. |
| 6 | Each product shows its licence holder and a COA | ✅ | Database trigger blocks publishing unless the producer has a licence number and there is an active lot with a COA. Product cards, product pages, cart, orders and PO PDFs show "licence holder · licence no.". COA download per lot. |
| 7 | Orders and account records kept and exportable (audit trail with dates and users) | ✅ | Append-only `audit_log` (updates/deletes raise an error) records account reviews, catalogue changes (field-level before/after), order status changes, invoices. Orders keep a snapshot of product, lot and price data. CSV export for orders (one row per line) and the full audit log. |
| 8 | Personal data under BC PIPA / PIPEDA, stored in Canada, clear privacy policy | ⚠️ Deployment | Privacy policy page drafted (PIPA/PIPEDA, Canadian storage, rights, OIPC BC). **Action:** create the Supabase project in Canada (Central) region; have counsel review `/privacy`. All files are in private buckets with short-lived signed links. |
| 9 | Accessibility WCAG 2.1 AA | ✅ | axe-core: 0 violations on all 30 page types at desktop and mobile. Skip link, visible focus, labelled forms with linked errors, keyboard-reachable scrolling tables, AA contrast (darker text companions for stone/moss). |
| 10 | Rules for the buyer type (licence holder to licence holder) | ⚠️ Lawyer | Buyers are federal licence holders only (no BC Direct Delivery retailers). Sign-up limited to licence classes that may buy from another licence holder; admin verifies each licence before approval; buyer confirms at checkout that their licence permits the purchase. **Action:** counsel to confirm the licence classes list (`src/lib/licence.ts`), terms, and record-keeping periods. |

## Page by page

Legend: P = no products/prices visible, A = age-gated, C = no claims/testimonials, I = no lifestyle imagery, W = WCAG 2.1 AA scan passed.

### Public

| Page | P | A | C | I | W | Notes |
|---|---|---|---|---|---|---|
| `/age-check` | ✅ | — | ✅ | ✅ | ✅ | "No" shows a refusal message; nothing else reachable. |
| `/` Home | ✅ | ✅ | ✅ | ✅ | ✅ | States access is verified-only. |
| `/how-it-works` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/about` | ✅ | ✅ | ✅ | ✅ | ✅ | Compliance commitments listed. Licence no. placeholder `X`. |
| `/contact` | ✅ | ✅ | ✅ | ✅ | ✅ | Contact details are placeholders. |
| `/privacy`, `/terms` | ✅ | ✅ | ✅ | ✅ | ✅ | Drafts, marked for legal review. |
| `/request-access` | ✅ | ✅ | ✅ | ✅ | ✅ | Collects licence details and document (private storage). Confirms 19+ and authority. |
| `/login`, `/forgot-password`, `/update-password` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/pending` | ✅ | ✅ | ✅ | ✅ | ✅ | Pending/rejected/suspended companies see status only. |

### Buyer (approved companies only)

| Page | Licence holder shown | COA | C | I | W |
|---|---|---|---|---|---|
| `/shop` catalogue | ✅ on every card | per product page | ✅ | ✅ | ✅ |
| `/shop/products/[id]` | ✅ | ✅ per lot | ✅ | ✅ | ✅ |
| `/shop/producers/[id]` | ✅ with licence no. | — | ✅ | ✅ | ✅ |
| `/shop/cart` | ✅ | — | ✅ | ✅ | ✅ |
| `/shop/orders`, `/shop/orders/[id]` | ✅ (snapshot) | — | ✅ | ✅ | ✅ |
| PO PDF | ✅ | — | ✅ | ✅ | n/a |

### Admin (CannaDry staff only; others get 404)

Dashboard, orders, products and lots, producers, categories, access requests, companies, audit log: all W ✅. Every change is written to the audit log with user and time.

## Before launch

1. Supabase project in **Canada (Central)**; turn on email confirmation; set the auth redirect URL to `https://<domain>/auth/confirm`.
2. Replace placeholders in `src/lib/site.ts` (licence number `X`, legal name, email, phone, address) and producer licence numbers (`X`) in the admin.
3. Legal review of `/privacy`, `/terms`, the eligible licence classes and record retention.
4. Set `RESEND_API_KEY`, `EMAIL_FROM` (verified domain) and `ADMIN_NOTIFY_EMAIL`.
5. Re-run `npm run check:a11y` against the production URL after content changes.

# CannaDry — Phase 1 Plan

Status: **draft, waiting for approval**. Nothing is built yet.

## 1. Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres, Auth (email + password, magic link optional), Storage. Project region: `ca-central-1` (Montreal).
- Row-level security (RLS) on every table. Access checks happen in the database, not only in the UI.
- Hosting: Vercel (function region `yul1` / closest to Canada). Email: Resend.
- Fonts: Fraunces (headings), Inter (UI and data), self-hosted via `next/font`.
- Seed script with fake producers, retailers and products (no real brand names).

## 2. User roles

A **user** belongs to one **company**. The company has a type and a status.

| Role | Who | Can do |
|---|---|---|
| Visitor | Not logged in | Public pages, request access. No products, no prices. |
| Pending | Signed up, not yet approved | See "your request is under review". Nothing else. |
| Buyer | User of an approved buyer company | Catalogue, product pages, producer profiles, cart, own company's orders. |
| Supplier | User of an approved supplier company | Own products, stock, COAs, incoming POs, dashboard. Also sees catalogue (read-only) if also a buyer. |
| Admin | CannaDry staff | Approve/reject/suspend companies, categories, all orders, CSV export, audit log. |

A company can be both supplier and buyer (e.g. a processor buying bulk flower). Within a company, users are `owner` or `member` (owner can invite colleagues — small, useful, cheap to add).

Suspended companies lose access immediately (enforced in RLS, not just by hiding links).

## 3. Pages

### Public (19+ age gate on first visit, stored in a cookie)
| Route | Content |
|---|---|
| `/` | One-line value statement, "For suppliers", "For buyers", Request access |
| `/how-it-works` | 3–4 steps per side |
| `/about` | Company, BC roots, compliance commitment |
| `/request-access` | Company legal name, licence type, licence number, province, contact, email, phone, licence document upload, password |
| `/contact`, `/privacy`, `/terms` | Static pages (privacy written for PIPA/PIPEDA, Canadian storage) |
| `/login`, `/reset-password` | Auth |

### Buyer (`/app/...`)
| Route | Content |
|---|---|
| `/app/catalogue` | Grid/list, filters: category, THC %, CBD %, format/size, producer, price/unit, minimum order, in stock |
| `/app/products/[id]` | Specs, case size, lot/batch, harvest or packaging date, terpenes, COA download, MOQ, lead time, licence holder |
| `/app/producers/[id]` | Profile, location, licence number, their products |
| `/app/cart` | Multi-vendor cart, grouped by supplier, MOQ checks, submit → one PO per supplier |
| `/app/orders`, `/app/orders/[id]` | Status timeline, PO/invoice PDF, re-order |

### Supplier (`/supplier/...`)
| Route | Content |
|---|---|
| `/supplier` | Dashboard: orders this month, top products, low-stock alerts |
| `/supplier/products`, `/new`, `/[id]` | Create/edit products, lots, COA upload, price, stock, publish/unpublish |
| `/supplier/orders`, `/[id]` | Incoming POs: accept, reject (with reason), mark shipped, mark delivered |
| `/supplier/profile` | Public producer profile |

### Admin (`/admin/...`)
| Route | Content |
|---|---|
| `/admin/requests` | Pending companies, licence document viewer, approve/reject with note |
| `/admin/companies` | All companies, suspend/reactivate |
| `/admin/categories` | Edit categories |
| `/admin/orders` | All orders, filters, CSV export |
| `/admin/audit` | Audit log (who, what, when) |

Shared: `/account` (user profile, company users).

## 4. Database tables

```
companies          id, legal_name, trade_name, kind (supplier|buyer|both), licence_type,
                   licence_number, province, address, status (pending|approved|rejected|suspended),
                   approved_by, approved_at, created_at
licence_documents  id, company_id, storage_path, uploaded_at             -- private bucket
profiles           id (= auth.users.id), company_id, full_name, phone, company_role (owner|member),
                   is_admin, created_at
categories         id, name, slug, sort_order, active
products           id, supplier_id, category_id, name, description (facts only), format, size,
                   units_per_case, price_per_unit_cents, min_order_units, lead_time_days,
                   status (draft|published|archived), created_at, updated_at
product_lots       id, product_id, lot_number, harvest_date, packaging_date, thc_pct, cbd_pct,
                   terpenes (jsonb: [{name, pct}]), coa_path, stock_units, created_at
                   -- a product can only be published if it has a lot with a COA
cart_items         id, buyer_company_id, user_id, lot_id, quantity_units
orders             id, po_number, buyer_company_id, supplier_company_id, placed_by,
                   status (submitted|accepted|rejected|shipped|delivered|cancelled),
                   subtotal_cents, notes, created_at
order_items        id, order_id, product_id, lot_id, snapshot (name, lot, price, THC/CBD),
                   quantity_units, unit_price_cents, line_total_cents
order_events       id, order_id, from_status, to_status, actor_id, note, created_at
audit_log          id, actor_id, actor_name, company_id, action, entity, entity_id, data (jsonb), created_at
```

Key rules:
- `orders` and `order_items` store a snapshot of price and lot data, so records stay accurate when products change.
- Status changes go through a database function that checks who may do what (e.g. only the supplier accepts; only from `submitted`) and writes `order_events` + `audit_log` in the same transaction.
- Cart checkout is one database function: validates MOQ and stock, splits by supplier, creates one order per supplier, reserves stock, clears the cart.
- Storage buckets: `licences` (admin + owning company only), `coas` (approved companies only), `images` (approved companies only). No public buckets for product content.
- Audit log is append-only (no update/delete policy for anyone).

## 5. Build order

1. Project setup, design tokens, layout, wordmark, age gate, public pages.
2. Auth + request-access flow + admin approval queue + emails (request received, approved, rejected).
3. Catalogue, filters, product page, producer profile (seed data).
4. Cart, checkout split into POs, buyer orders, re-order, PO PDF.
5. Supplier area: products/lots/COAs, incoming orders, dashboard.
6. Admin: companies, categories, all orders, CSV export, audit log.
7. Compliance pass (section 5 of the brief), page by page, plus accessibility check (axe + keyboard).

After each step: short list of what was built and what is left.

## 6. Open questions (defaults I will use if you don't specify)

1. **Buyer types** — default: **both** (federal licence holders and BC retailers under Direct Delivery), modelled with `licence_type`. The data model supports both either way; the difference is licence types allowed at sign-up and legal copy.
2. **Business model** — default: **free during launch**. No billing code in Phase 1; a commission field can be added later.
3. **French version** — default: **English only**, but all UI text goes through a translation file so French can be added without rewrites.
4. **Seed-to-sale / ERP** — default: none in Phase 1. Product/lot fields are kept close to common seed-to-sale exports so a later import is simple.
5. **Invoices** — Phase 1 has no payment. Default: generate a **PO PDF** per order; the "invoice" is uploaded by the supplier as a PDF on the order. Confirm this is acceptable.
6. **Supabase / Vercel accounts** — I will build against a local Supabase (migrations in the repo). You or the client will need to create the hosted projects (Canada region) and provide keys for deployment.

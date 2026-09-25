# CannaDry — Phase 1 Plan (v2)

Status: **approved**. Build progress is tracked in section 7.

## 0. What changed from v1

Client answers:
1. Buyers are licensed suppliers: federal licence holders such as producers and processors. BC retailers are **not** buyers.
2. Business model: CannaDry is a **wholesale shop**. There is no commission and no subscription.
3. CannaDry sells **all** products itself. Suppliers have no accounts, and CannaDry controls every listing.

So CannaDry is a **single-seller wholesale shop**, not a marketplace:
- There is no supplier area and no supplier logins.
- CannaDry staff (admin) create and edit every product, lot, price, stock level and COA.
- Checkout produces **one order** to CannaDry, so orders are no longer split by vendor.
- Producers become **reference records** managed by admin. Each product still shows its licence holder, because the compliance rules require it.

## 1. Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase in `ca-central-1` (Montreal): Postgres, logins, file storage, and row-level security (RLS) on every table
- Vercel hosting and Resend for email
- Fraunces for headings and Inter for UI and data
- Seed script with fake producers, buyers and products. No real brand names.

## 2. User roles

| Role | Who | Can do |
|---|---|---|
| Visitor | Not logged in | Public pages and the access request. Never products or prices. |
| Pending | Signed up, not yet approved | Sees only "your request is under review". |
| Buyer | User of an approved licence-holder company | Catalogue, product pages, cart, and their own company's orders and invoices |
| Admin | CannaDry staff | Everything below: accounts, catalogue, orders, exports, audit log |

A buyer company can have several users. The first user is the `owner` and can invite colleagues. Suspending a company cuts its access in the database right away.

## 3. Pages

### Public (19+ age gate)
`/`, `/how-it-works` (steps for buyers), `/about`, `/request-access`, `/contact`, `/privacy`, `/terms`, `/login`, `/reset-password`

The access request collects: company legal name, licence type (cultivation, processing, and so on), Health Canada licence number, province, contact person, email, phone and the licence document.

### Buyer (`/shop/...`)
| Route | Content |
|---|---|
| `/shop` | Catalogue. Filters: category, THC %, CBD %, format/size, producer, price per unit, minimum order, in stock |
| `/shop/products/[id]` | Specs, case size, lot/batch, harvest or packaging date, terpenes, COA download, minimum order, lead time, licence holder |
| `/shop/producers/[id]` | Producer info written by CannaDry: location, licence number, their products |
| `/shop/cart` | Single cart and one order to CannaDry, with minimum-order and stock checks |
| `/shop/orders`, `/[id]` | Status (submitted → accepted → shipped → delivered), PO and invoice PDFs, re-order |
| `/account` | Profile and company users |

### Admin (`/admin/...`)
| Route | Content |
|---|---|
| `/admin` | Dashboard: orders this month, top products, low-stock alerts, pending requests |
| `/admin/requests` | Access requests with licence document viewer; approve or reject with a note |
| `/admin/companies` | Buyer companies; suspend or reactivate |
| `/admin/producers` | Producer records (name, licence number, location, description) |
| `/admin/products`, `/new`, `/[id]` | Create and edit products, lots, COAs, prices and stock; publish or unpublish |
| `/admin/categories` | Edit categories |
| `/admin/orders`, `/[id]` | Accept or reject (with reason), mark shipped or delivered, upload invoice; CSV export |
| `/admin/audit` | Audit log: who, what and when |

## 4. Database tables

```
companies          id, legal_name, licence_type, licence_number, province, address,
                   status (pending|approved|rejected|suspended), approved_by, approved_at, created_at
licence_documents  id, company_id, storage_path, uploaded_at          -- private bucket
profiles           id (= auth user), company_id (null for staff), full_name, phone,
                   company_role (owner|member), is_admin, created_at
producers          id, name, licence_number, city, province, description, active
categories         id, name, slug, sort_order, active
products           id, producer_id, category_id, name, description (facts only), format, size,
                   units_per_case, price_per_unit_cents, min_order_units, lead_time_days,
                   status (draft|published|archived), created_at, updated_at
product_lots       id, product_id, lot_number, harvest_date, packaging_date, thc_pct, cbd_pct,
                   terpenes (jsonb), coa_path, stock_units, created_at
cart_items         id, company_id, user_id, lot_id, quantity_units
orders             id, po_number, company_id, placed_by, status
                   (submitted|accepted|rejected|shipped|delivered|cancelled),
                   subtotal_cents, notes, invoice_path, created_at
order_items        id, order_id, product_id, lot_id, snapshot (jsonb), quantity_units,
                   unit_price_cents, line_total_cents
order_events       id, order_id, from_status, to_status, actor_id, note, created_at
audit_log          id, actor_id, actor_name, company_id, action, entity, entity_id, data, created_at
```

Key rules:
- Buyers can read only published products, their own company's cart and orders, and COAs. Only admins can write to the catalogue.
- A product can't be published unless it has a lot with a COA and a producer with a licence number.
- Checkout runs as one database step: it checks minimums and stock, creates the order, reserves the stock and clears the cart.
- Each order stores a copy of the price and lot details, so records stay accurate when products change.
- Every status change is written to `order_events` and `audit_log`. The audit log can only be added to, never edited or deleted.
- Storage: `licences` (admin and the owning company only), `coas` and `images` (approved companies only). No public buckets.

## 5. Build order

1. Setup, design tokens, wordmark, age gate, public pages
2. Logins, access requests, admin approval queue, emails
3. Admin catalogue management (producers, products, lots, COAs), then the buyer catalogue and product pages
4. Cart, checkout, buyer orders, re-order, PO PDF
5. Admin orders, invoice upload, dashboard, CSV export, audit log
6. Compliance check, page by page, including accessibility

## 6. Decisions

1. **Producer on products**: shown ("Produced by …, licence #…"). Placeholder value `X` for now.
2. **Language**: English only.
3. **Invoices**: automatic PO PDF per order, and CannaDry uploads its invoice PDF to the order.
4. **ERP / seed-to-sale**: later.
5. **CannaDry licence number**: placeholder `X` in `src/lib/site.ts`.

## 7. Progress

- [x] Step 1: setup, design tokens, wordmark, 19+ age gate, public pages
- [x] Step 2: logins, access requests, admin approval queue, emails
- [ ] Step 3: catalogue management and buyer catalogue
- [ ] Step 4: cart, checkout, buyer orders
- [ ] Step 5: admin orders, dashboard, CSV export, audit log
- [ ] Step 6: compliance check

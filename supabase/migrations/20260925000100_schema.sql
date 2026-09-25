-- CannaDry Phase 1 schema.
-- Single-seller wholesale shop: CannaDry (admin) manages the catalogue,
-- verified licence-holder companies (buyers) place purchase orders.
-- Every table has row-level security. Writes that must stay consistent
-- (reviews, checkout, status changes) go through security-definer functions
-- that also write the audit log.

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.company_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.product_status as enum ('draft', 'published', 'archived');
create type public.order_status as enum ('submitted', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled');

-- ---------------------------------------------------------------------------
-- Companies and people
-- ---------------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (length(legal_name) between 2 and 200),
  licence_type text not null,
  licence_number text not null check (length(licence_number) between 2 and 60),
  province text not null,
  address text,
  contact_name text not null,
  contact_email extensions.citext not null,
  contact_phone text not null,
  status public.company_status not null default 'pending',
  review_note text,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index companies_status_idx on public.companies (status, created_at desc);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete restrict,
  full_name text not null,
  email extensions.citext not null,
  phone text,
  company_role text not null default 'member' check (company_role in ('owner', 'member')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  -- A user is either CannaDry staff or belongs to a buyer company.
  constraint profiles_company_or_admin check (is_admin or company_id is not null)
);
create index profiles_company_idx on public.profiles (company_id);

create table public.licence_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  uploaded_by uuid references auth.users (id),
  uploaded_at timestamptz not null default now()
);
create index licence_documents_company_idx on public.licence_documents (company_id);

-- ---------------------------------------------------------------------------
-- Catalogue (managed by CannaDry staff)
-- ---------------------------------------------------------------------------
create table public.producers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  licence_number text not null,
  city text,
  province text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  sort_order int not null default 0,
  active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.producers (id),
  category_id uuid not null references public.categories (id),
  name text not null,
  description text,
  format text not null,              -- e.g. "Whole flower", "Pre-roll 0.5 g x 3"
  size_label text not null,          -- e.g. "3.5 g", "1 kg bulk"
  units_per_case int not null check (units_per_case > 0),
  price_per_unit_cents int not null check (price_per_unit_cents >= 0),
  min_order_units int not null default 1 check (min_order_units > 0),
  lead_time_days int not null default 0 check (lead_time_days >= 0),
  image_path text,
  status public.product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on public.products (status, category_id);
create index products_producer_idx on public.products (producer_id);

create table public.product_lots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  lot_number text not null,
  harvest_date date,
  packaging_date date,
  thc_pct numeric(5, 2) check (thc_pct between 0 and 100),
  cbd_pct numeric(5, 2) check (cbd_pct between 0 and 100),
  terpenes jsonb not null default '[]'::jsonb,   -- [{ "name": "Myrcene", "pct": 0.8 }]
  coa_path text,
  stock_units int not null default 0 check (stock_units >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, lot_number)
);
create index product_lots_product_idx on public.product_lots (product_id);

-- ---------------------------------------------------------------------------
-- Cart and orders
-- ---------------------------------------------------------------------------
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  lot_id uuid not null references public.product_lots (id) on delete cascade,
  quantity_units int not null check (quantity_units > 0),
  created_at timestamptz not null default now(),
  unique (user_id, lot_id)
);

create sequence public.po_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique default ('CD-' || nextval('public.po_number_seq')::text),
  company_id uuid not null references public.companies (id),
  placed_by uuid not null references auth.users (id),
  status public.order_status not null default 'submitted',
  subtotal_cents bigint not null default 0,
  notes text,
  invoice_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_company_idx on public.orders (company_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  lot_id uuid not null references public.product_lots (id),
  snapshot jsonb not null,           -- product, producer and lot data at time of order
  quantity_units int not null check (quantity_units > 0),
  unit_price_cents int not null,
  line_total_cents bigint not null
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  actor_id uuid references auth.users (id),
  actor_name text,
  note text,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

-- ---------------------------------------------------------------------------
-- Audit log (append-only)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id),
  actor_name text,
  actor_email text,
  company_id uuid references public.companies (id),
  action text not null,
  entity text not null,
  entity_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger companies_touch before update on public.companies
  for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Access helpers (security definer so policies can call them without recursion)
-- ---------------------------------------------------------------------------
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create function public.current_company_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.company_id from public.profiles p where p.id = auth.uid();
$$;

-- True when the signed-in user belongs to an approved company.
create function public.is_active_buyer() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.companies c on c.id = p.company_id
    where p.id = auth.uid() and c.status = 'approved'
  );
$$;

-- Internal: append a row to the audit log with the current user's details.
create function public.write_audit(
  p_action text, p_entity text, p_entity_id text, p_company_id uuid, p_data jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_email text;
begin
  select p.full_name, p.email into v_name, v_email from public.profiles p where p.id = auth.uid();
  insert into public.audit_log (actor_id, actor_name, actor_email, company_id, action, entity, entity_id, data)
  values (auth.uid(), v_name, v_email, p_company_id, p_action, p_entity, p_entity_id, coalesce(p_data, '{}'::jsonb));
end $$;
revoke execute on function public.write_audit from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.licence_documents enable row level security;
alter table public.producers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_lots enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.audit_log enable row level security;

-- Nothing is readable anonymously.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- companies: members see their own company; admins see all.
-- Status changes only through review_company()/set_company_status().
create policy companies_select on public.companies for select to authenticated
  using (id = public.current_company_id() or public.is_admin());
revoke insert, update, delete on public.companies from authenticated;

-- profiles: see yourself, your colleagues, or everything if admin.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or company_id = public.current_company_id() or public.is_admin());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- licence documents: own company or admin, read only.
create policy licence_documents_select on public.licence_documents for select to authenticated
  using (company_id = public.current_company_id() or public.is_admin());
revoke insert, update, delete on public.licence_documents from authenticated;

-- catalogue: approved buyers read published data; admins manage everything.
create policy producers_read on public.producers for select to authenticated
  using ((active and public.is_active_buyer()) or public.is_admin());
create policy producers_admin on public.producers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy categories_read on public.categories for select to authenticated
  using ((active and public.is_active_buyer()) or public.is_admin());
create policy categories_admin on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy products_read on public.products for select to authenticated
  using ((status = 'published' and public.is_active_buyer()) or public.is_admin());
create policy products_admin on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy product_lots_read on public.product_lots for select to authenticated
  using (
    public.is_admin()
    or (
      active and public.is_active_buyer()
      and exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
    )
  );
create policy product_lots_admin on public.product_lots for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- cart: your own rows, only while your company is approved.
create policy cart_items_own on public.cart_items for all to authenticated
  using (user_id = auth.uid() and public.is_active_buyer())
  with check (
    user_id = auth.uid() and company_id = public.current_company_id() and public.is_active_buyer()
  );

-- orders: own company (while approved) or admin. Writes only via functions.
create policy orders_select on public.orders for select to authenticated
  using ((company_id = public.current_company_id() and public.is_active_buyer()) or public.is_admin());
revoke insert, update, delete on public.orders from authenticated;

create policy order_items_select on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));
revoke insert, update, delete on public.order_items from authenticated;

create policy order_events_select on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));
revoke insert, update, delete on public.order_events from authenticated;

-- audit log: admins read; nobody updates or deletes.
create policy audit_log_select on public.audit_log for select to authenticated
  using (public.is_admin());
revoke insert, update, delete on public.audit_log from authenticated;

-- Guard against edits even by privileged roles (append-only).
create function public.audit_log_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end $$;
create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

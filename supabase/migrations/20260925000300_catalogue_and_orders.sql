-- Catalogue view, publishing rules, catalogue audit trail, checkout and order status changes.

-- ---------------------------------------------------------------------------
-- Catalogue view (security_invoker: row-level security of the caller applies)
-- ---------------------------------------------------------------------------
create view public.catalogue with (security_invoker = true) as
select
  p.id,
  p.name,
  p.description,
  p.format,
  p.size_label,
  p.units_per_case,
  p.price_per_unit_cents,
  p.min_order_units,
  p.lead_time_days,
  p.status,
  p.category_id,
  c.name as category_name,
  c.slug as category_slug,
  p.producer_id,
  pr.name as producer_name,
  pr.licence_number as producer_licence,
  coalesce(sum(l.stock_units) filter (where l.active), 0)::int as stock_units,
  min(l.thc_pct) filter (where l.active) as thc_min,
  max(l.thc_pct) filter (where l.active) as thc_max,
  min(l.cbd_pct) filter (where l.active) as cbd_min,
  max(l.cbd_pct) filter (where l.active) as cbd_max,
  count(l.id) filter (where l.active)::int as lot_count,
  p.created_at,
  p.updated_at
from public.products p
join public.categories c on c.id = p.category_id
join public.producers pr on pr.id = p.producer_id
left join public.product_lots l on l.product_id = p.id
group by p.id, c.id, pr.id;

revoke all on public.catalogue from anon;
grant select on public.catalogue to authenticated;

-- ---------------------------------------------------------------------------
-- Publishing rule: a product is visible to buyers only with a licence holder and a COA.
-- ---------------------------------------------------------------------------
create function public.check_product_publishable() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'published' then
    if not exists (
      select 1 from public.producers pr
      where pr.id = new.producer_id and pr.active and coalesce(btrim(pr.licence_number), '') <> ''
    ) then
      raise exception 'Cannot publish: the producer must be active and have a licence number';
    end if;
    if not exists (
      select 1 from public.product_lots l
      where l.product_id = new.id and l.active and l.coa_path is not null
    ) then
      raise exception 'Cannot publish: add at least one active lot with a certificate of analysis';
    end if;
  end if;
  return new;
end $$;

create trigger products_publishable before insert or update of status, producer_id on public.products
  for each row execute function public.check_product_publishable();

-- ---------------------------------------------------------------------------
-- Audit trail for catalogue changes (who changed which field, when)
-- ---------------------------------------------------------------------------
create function public.audit_row_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_id text;
  v_data jsonb;
begin
  if tg_op = 'DELETE' then
    v_id := old.id::text;
    v_data := jsonb_build_object('old', to_jsonb(old));
  elsif tg_op = 'INSERT' then
    v_id := new.id::text;
    v_data := jsonb_build_object('new', to_jsonb(new));
  else
    v_id := new.id::text;
    select jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value))
      into v_data
      from jsonb_each(to_jsonb(new)) n
      join jsonb_each(to_jsonb(old)) o using (key)
     where n.value is distinct from o.value and n.key <> 'updated_at';
    if v_data is null then
      return new;
    end if;
    v_data := jsonb_build_object('changes', v_data);
  end if;

  perform public.write_audit(tg_table_name || '.' || lower(tg_op), tg_table_name, v_id, null, v_data);
  return coalesce(new, old);
end $$;

create trigger producers_audit after insert or update or delete on public.producers
  for each row execute function public.audit_row_change();
create trigger categories_audit after insert or update or delete on public.categories
  for each row execute function public.audit_row_change();
create trigger products_audit after insert or update or delete on public.products
  for each row execute function public.audit_row_change();
create trigger product_lots_audit after insert or update or delete on public.product_lots
  for each row execute function public.audit_row_change();

-- ---------------------------------------------------------------------------
-- Checkout: turns the signed-in user's cart into one purchase order.
-- Validates availability, COA, minimum order, full cases and stock; reserves stock.
-- ---------------------------------------------------------------------------
create function public.place_order(p_notes text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_company uuid;
  v_order uuid;
  v_subtotal bigint := 0;
  v_name text;
  r record;
begin
  if not public.is_active_buyer() then
    raise exception 'Your account is not approved for ordering' using errcode = '42501';
  end if;
  v_company := public.current_company_id();

  if not exists (select 1 from public.cart_items where user_id = auth.uid()) then
    raise exception 'Your cart is empty';
  end if;

  insert into public.orders (company_id, placed_by, notes)
  values (v_company, auth.uid(), nullif(btrim(p_notes), ''))
  returning id into v_order;

  for r in
    select ci.quantity_units,
           l.id as lot_id, l.lot_number, l.stock_units, l.active as lot_active, l.coa_path,
           l.thc_pct, l.cbd_pct, l.harvest_date, l.packaging_date,
           p.id as product_id, p.name, p.status, p.price_per_unit_cents, p.min_order_units,
           p.units_per_case, p.format, p.size_label,
           pr.name as producer_name, pr.licence_number as producer_licence,
           c.name as category_name
      from public.cart_items ci
      join public.product_lots l on l.id = ci.lot_id
      join public.products p on p.id = l.product_id
      join public.producers pr on pr.id = p.producer_id
      join public.categories c on c.id = p.category_id
     where ci.user_id = auth.uid()
     order by l.id
     for update of l
  loop
    if r.status <> 'published' or not r.lot_active or r.coa_path is null then
      raise exception '% (lot %) is no longer available', r.name, r.lot_number;
    end if;
    if r.quantity_units < r.min_order_units then
      raise exception '%: the minimum order is % units', r.name, r.min_order_units;
    end if;
    if r.quantity_units % r.units_per_case <> 0 then
      raise exception '%: order in full cases of % units', r.name, r.units_per_case;
    end if;
    if r.quantity_units > r.stock_units then
      raise exception '% (lot %): only % units in stock', r.name, r.lot_number, r.stock_units;
    end if;

    update public.product_lots set stock_units = stock_units - r.quantity_units where id = r.lot_id;

    insert into public.order_items (
      order_id, product_id, lot_id, snapshot, quantity_units, unit_price_cents, line_total_cents
    ) values (
      v_order, r.product_id, r.lot_id,
      jsonb_build_object(
        'name', r.name, 'category', r.category_name, 'format', r.format, 'size', r.size_label,
        'units_per_case', r.units_per_case, 'lot_number', r.lot_number,
        'thc_pct', r.thc_pct, 'cbd_pct', r.cbd_pct,
        'harvest_date', r.harvest_date, 'packaging_date', r.packaging_date,
        'producer', r.producer_name, 'producer_licence', r.producer_licence
      ),
      r.quantity_units, r.price_per_unit_cents, r.quantity_units::bigint * r.price_per_unit_cents
    );
    v_subtotal := v_subtotal + r.quantity_units::bigint * r.price_per_unit_cents;
  end loop;

  update public.orders set subtotal_cents = v_subtotal where id = v_order;

  select full_name into v_name from public.profiles where id = auth.uid();
  insert into public.order_events (order_id, from_status, to_status, actor_id, actor_name, note)
  values (v_order, null, 'submitted', auth.uid(), v_name, nullif(btrim(p_notes), ''));

  delete from public.cart_items where user_id = auth.uid();

  perform public.write_audit('order.submitted', 'order', v_order::text, v_company,
                             jsonb_build_object('subtotal_cents', v_subtotal));
  return v_order;
end $$;
revoke execute on function public.place_order from public, anon;
grant execute on function public.place_order to authenticated;

-- ---------------------------------------------------------------------------
-- Order status changes.
--   CannaDry staff: submitted -> accepted | rejected | cancelled
--                   accepted  -> shipped | cancelled
--                   shipped   -> delivered
--   Buyer:          submitted -> cancelled (own company, while approved)
-- Rejected and cancelled orders return their stock.
-- ---------------------------------------------------------------------------
create function public.set_order_status(p_order_id uuid, p_status public.order_status, p_note text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_admin boolean := public.is_admin();
  v_name text;
  v_allowed boolean;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'Order not found';
  end if;

  if v_admin then
    v_allowed := (v_order.status, p_status) in (
      ('submitted'::public.order_status, 'accepted'::public.order_status),
      ('submitted', 'rejected'), ('submitted', 'cancelled'),
      ('accepted', 'shipped'), ('accepted', 'cancelled'),
      ('shipped', 'delivered')
    );
  elsif v_order.company_id = public.current_company_id() and public.is_active_buyer() then
    v_allowed := v_order.status = 'submitted' and p_status = 'cancelled';
  else
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  if not v_allowed then
    raise exception 'Cannot change this order from % to %', v_order.status, p_status;
  end if;
  if p_status in ('rejected', 'cancelled') and coalesce(btrim(p_note), '') = '' then
    raise exception 'A reason is required';
  end if;

  if p_status in ('rejected', 'cancelled') then
    update public.product_lots l
       set stock_units = l.stock_units + oi.quantity_units
      from public.order_items oi
     where oi.order_id = p_order_id and oi.lot_id = l.id;
  end if;

  update public.orders set status = p_status where id = p_order_id;

  select full_name into v_name from public.profiles where id = auth.uid();
  insert into public.order_events (order_id, from_status, to_status, actor_id, actor_name, note)
  values (p_order_id, v_order.status, p_status, auth.uid(), v_name, nullif(btrim(p_note), ''));

  perform public.write_audit('order.' || p_status::text, 'order', p_order_id::text, v_order.company_id,
                             jsonb_build_object('from', v_order.status, 'to', p_status, 'note', p_note));
end $$;
revoke execute on function public.set_order_status from public, anon;
grant execute on function public.set_order_status to authenticated;

-- Attach an invoice PDF (already uploaded to invoices/<company_id>/...) to an order.
create function public.set_order_invoice(p_order_id uuid, p_path text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_company uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  select company_id into v_company from public.orders where id = p_order_id for update;
  if v_company is null then
    raise exception 'Order not found';
  end if;
  if split_part(p_path, '/', 1) <> v_company::text then
    raise exception 'Invoice must be stored in the company folder';
  end if;
  update public.orders set invoice_path = p_path where id = p_order_id;
  perform public.write_audit('order.invoice_attached', 'order', p_order_id::text, v_company,
                             jsonb_build_object('path', p_path));
end $$;
revoke execute on function public.set_order_invoice from public, anon;
grant execute on function public.set_order_invoice to authenticated;

-- Stock can only change through the functions above or by staff.
create index order_items_lot_idx on public.order_items (lot_id);
create index product_lots_low_stock_idx on public.product_lots (stock_units) where active;

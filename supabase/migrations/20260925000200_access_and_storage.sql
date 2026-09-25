-- Access requests, company review, and private storage buckets.

-- ---------------------------------------------------------------------------
-- Access request (called by the server with the service role after sign-up)
-- ---------------------------------------------------------------------------
create function public.create_access_request(
  p_user_id uuid,
  p_company_id uuid,
  p_legal_name text,
  p_licence_type text,
  p_licence_number text,
  p_province text,
  p_address text,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_document_path text,
  p_document_name text
) returns uuid
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.companies (
    id, legal_name, licence_type, licence_number, province, address,
    contact_name, contact_email, contact_phone
  ) values (
    p_company_id, p_legal_name, p_licence_type, p_licence_number, p_province, p_address,
    p_contact_name, p_contact_email, p_contact_phone
  );

  insert into public.profiles (id, company_id, full_name, email, phone, company_role)
  values (p_user_id, p_company_id, p_contact_name, p_contact_email, p_contact_phone, 'owner');

  insert into public.licence_documents (company_id, storage_path, file_name, uploaded_by)
  values (p_company_id, p_document_path, p_document_name, p_user_id);

  insert into public.audit_log (actor_id, actor_name, actor_email, company_id, action, entity, entity_id, data)
  values (
    p_user_id, p_contact_name, p_contact_email, p_company_id, 'company.requested', 'company', p_company_id::text,
    jsonb_build_object('legal_name', p_legal_name, 'licence_type', p_licence_type,
                       'licence_number', p_licence_number, 'province', p_province)
  );

  return p_company_id;
end $$;
revoke execute on function public.create_access_request from public, anon, authenticated;
grant execute on function public.create_access_request to service_role;

-- ---------------------------------------------------------------------------
-- Admin: approve / reject a pending request
-- ---------------------------------------------------------------------------
create function public.review_company(p_company_id uuid, p_decision public.company_status, p_note text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_old public.company_status;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;
  if p_decision = 'rejected' and coalesce(btrim(p_note), '') = '' then
    raise exception 'A reason is required when rejecting a request';
  end if;

  select status into v_old from public.companies where id = p_company_id for update;
  if v_old is null then
    raise exception 'Company not found';
  end if;
  if v_old <> 'pending' then
    raise exception 'Only pending requests can be reviewed (current status: %)', v_old;
  end if;

  update public.companies
     set status = p_decision, review_note = nullif(btrim(p_note), ''),
         reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_company_id;

  perform public.write_audit(
    'company.' || p_decision::text, 'company', p_company_id::text, p_company_id,
    jsonb_build_object('from', v_old, 'to', p_decision, 'note', p_note)
  );
end $$;
revoke execute on function public.review_company from public, anon;
grant execute on function public.review_company to authenticated;

-- ---------------------------------------------------------------------------
-- Admin: suspend / reactivate an approved company
-- ---------------------------------------------------------------------------
create function public.set_company_status(p_company_id uuid, p_status public.company_status, p_note text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_old public.company_status;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select status into v_old from public.companies where id = p_company_id for update;
  if v_old is null then
    raise exception 'Company not found';
  end if;
  if not ((v_old = 'approved' and p_status = 'suspended') or (v_old = 'suspended' and p_status = 'approved')) then
    raise exception 'Cannot change status from % to %', v_old, p_status;
  end if;
  if p_status = 'suspended' and coalesce(btrim(p_note), '') = '' then
    raise exception 'A reason is required when suspending a company';
  end if;

  update public.companies
     set status = p_status, review_note = nullif(btrim(p_note), ''),
         reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_company_id;

  -- A suspended company cannot keep items in carts.
  if p_status = 'suspended' then
    delete from public.cart_items where company_id = p_company_id;
  end if;

  perform public.write_audit(
    'company.' || case when p_status = 'suspended' then 'suspended' else 'reactivated' end,
    'company', p_company_id::text, p_company_id,
    jsonb_build_object('from', v_old, 'to', p_status, 'note', p_note)
  );
end $$;
revoke execute on function public.set_company_status from public, anon;
grant execute on function public.set_company_status to authenticated;

-- Helper functions are for policies and signed-in users only.
revoke execute on function public.is_admin, public.current_company_id, public.is_active_buyer from public, anon;
grant execute on function public.is_admin, public.current_company_id, public.is_active_buyer to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: all buckets are private. Files are served through short-lived signed URLs.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('licences', 'licences', false, 4194304, array['application/pdf', 'image/jpeg', 'image/png']),
  ('coas', 'coas', false, 4194304, array['application/pdf']),
  ('product-images', 'product-images', false, 4194304, array['image/jpeg', 'image/png', 'image/webp']),
  ('invoices', 'invoices', false, 4194304, array['application/pdf'])
on conflict (id) do nothing;

-- Licence documents live under licences/<company_id>/...
create policy licences_read on storage.objects for select to authenticated
  using (
    bucket_id = 'licences'
    and (public.is_admin() or (storage.foldername(name))[1] = public.current_company_id()::text)
  );

-- COAs and product images: approved buyers read, admins manage.
create policy catalogue_files_read on storage.objects for select to authenticated
  using (bucket_id in ('coas', 'product-images') and (public.is_active_buyer() or public.is_admin()));
create policy catalogue_files_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('coas', 'product-images', 'invoices') and public.is_admin());
create policy catalogue_files_admin_update on storage.objects for update to authenticated
  using (bucket_id in ('coas', 'product-images', 'invoices') and public.is_admin());
create policy catalogue_files_admin_delete on storage.objects for delete to authenticated
  using (bucket_id in ('coas', 'product-images', 'invoices') and public.is_admin());

-- Invoices live under invoices/<company_id>/...
create policy invoices_read on storage.objects for select to authenticated
  using (
    bucket_id = 'invoices'
    and (
      public.is_admin()
      or ((storage.foldername(name))[1] = public.current_company_id()::text and public.is_active_buyer())
    )
  );

-- Future tables and functions in public are not exposed to anonymous visitors by default.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon, public;

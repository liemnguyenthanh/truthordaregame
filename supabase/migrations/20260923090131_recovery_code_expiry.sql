-- Recovery codes expire exactly 7 days after issuance, including existing codes.
-- Restoring never extends this window. Existing entitlements are unchanged.
create or replace function public.restore_purchase(p_guest uuid,p_hash text) returns text language plpgsql security definer set search_path=public as $$
declare p purchases; begin
 perform 1 from guest_sessions where id=p_guest and expires_at>now();if not found then raise exception 'invalid guest';end if;
 select * into p from purchases where recovery_hash=p_hash and status='active' for update;
 if not found then return null; end if;
 if p.created_at + interval '7 days' <= now() then return null; end if;
 insert into entitlements(guest_id,purchase_id,pack_id) values(p_guest,p.id,p.pack_id) on conflict(guest_id,purchase_id) do nothing;
 insert into audit_events(kind,order_id,guest_id) values('purchase_restored',p.order_id,p_guest);
 return p.pack_id;
end $$;

revoke all on function public.restore_purchase(uuid,text) from public,anon,authenticated;
grant execute on function public.restore_purchase(uuid,text) to service_role;

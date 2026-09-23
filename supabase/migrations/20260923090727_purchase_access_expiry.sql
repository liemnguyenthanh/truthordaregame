-- One purchase grants seven days. Existing purchases keep their original start date.
alter table public.purchases add column expires_at timestamptz;
update public.purchases set expires_at=created_at+interval '7 days';
alter table public.purchases alter column expires_at set default now()+interval '7 days', alter column expires_at set not null;
create or replace function public.create_order(p_guest uuid,p_pack text,p_key text,p_code text) returns jsonb language plpgsql security definer set search_path=public as $$
declare o orders; p products; begin
 -- Serialize all create/retry requests for one guest, including different idempotency keys.
 perform 1 from guest_sessions where id=p_guest and expires_at>now() for update;
 if not found then raise exception 'invalid guest'; end if;
 select orders.* into o from order_requests join orders on orders.id=order_requests.order_id where order_requests.guest_id=p_guest and idempotency_key=p_key;
 if found then
   if o.pack_id<>p_pack then return jsonb_build_object('error','conflict'); end if;
   return to_jsonb(o);
 end if;
 if exists(select 1 from entitlements e join purchases owned on owned.id=e.purchase_id where e.guest_id=p_guest and e.pack_id=p_pack and e.revoked_at is null and owned.status='active' and owned.expires_at>now()) then return jsonb_build_object('alreadyOwned',true); end if;
 select * into p from products where pack_id=p_pack and active for share;
 if not found then return jsonb_build_object('error','unavailable'); end if;
 select * into o from orders where guest_id=p_guest and pack_id=p_pack and status='pending' and expires_at>now() order by created_at desc limit 1;
 if not found then
 insert into orders(guest_id,product_id,pack_id,amount_vnd,title_snapshot,price_version,payment_code) values(p_guest,p.id,p_pack,p.price_vnd,p.title,p.price_version,p_code) returning * into o;
 end if;
 insert into order_requests values(p_guest,p_key,o.id);
 return to_jsonb(o);
end $$;

create or replace function public.apply_payment(p_transaction text,p_code text,p_amount bigint,p_bank_time timestamptz,p_direction text,p_account_valid boolean,p_recovery_hash text,p_recovery_ciphertext text) returns text language plpgsql security definer set search_path=public as $$
declare o orders; event_id uuid; purchase_id uuid; outcome text; begin
 -- Unique insertion waits for concurrent retry transaction. Any exception rolls everything back.
 insert into payment_events(provider_transaction_id,amount,bank_transaction_at,processing_status) values(p_transaction,p_amount,p_bank_time,'received') on conflict(provider,provider_transaction_id) do nothing returning id into event_id;
 if event_id is null then return 'duplicate'; end if;
 select * into o from orders where payment_code=p_code for update;
 if not found then outcome:='unmatched';
 elsif not p_account_valid or p_direction<>'in' then outcome:='wrong_account_or_direction';
 elsif o.status in ('paid','refunded') then outcome:='duplicate_payment_review';
 elsif p_amount<>o.amount_vnd or p_bank_time<date_trunc('second',o.created_at) or p_bank_time>o.created_at+interval '24 hours' or p_bank_time>now()+interval '5 minutes' then
   outcome:='review_required'; update orders set status='review_required' where id=o.id;
 else
   -- Prevent concurrent different orders for the same guest/pack granting two purchases.
   perform pg_advisory_xact_lock(hashtextextended(o.guest_id::text||o.pack_id,0));
   if exists(select 1 from entitlements e join purchases owned on owned.id=e.purchase_id where e.guest_id=o.guest_id and e.pack_id=o.pack_id and e.revoked_at is null and owned.status='active' and owned.expires_at>now()) then
     outcome:='duplicate_pack_review';update orders set status='review_required' where id=o.id;
   else
     update orders set status='paid',paid_at=p_bank_time where id=o.id;
     insert into purchases(order_id,pack_id,recovery_hash,recovery_ciphertext) values(o.id,o.pack_id,p_recovery_hash,p_recovery_ciphertext) returning id into purchase_id;
     insert into entitlements(guest_id,purchase_id,pack_id) values(o.guest_id,purchase_id,o.pack_id);
     insert into audit_events(kind,order_id,guest_id) values('payment_confirmed',o.id,o.guest_id);
     outcome:='paid';
   end if;
 end if;
 update payment_events set order_id=o.id,processing_status=outcome where id=event_id;
 return outcome;
end $$;

create or replace function public.restore_purchase(p_guest uuid,p_hash text) returns text language plpgsql security definer set search_path=public as $$
declare p purchases; begin
 perform 1 from guest_sessions where id=p_guest and expires_at>now();if not found then raise exception 'invalid guest';end if;
 select * into p from purchases where recovery_hash=p_hash and status='active' for update;
 if not found then return null; end if;
 if p.expires_at <= now() then return null; end if;
 insert into entitlements(guest_id,purchase_id,pack_id) values(p_guest,p.id,p.pack_id) on conflict(guest_id,purchase_id) do nothing;
 insert into audit_events(kind,order_id,guest_id) values('purchase_restored',p.order_id,p_guest);
 return p.pack_id;
end $$;


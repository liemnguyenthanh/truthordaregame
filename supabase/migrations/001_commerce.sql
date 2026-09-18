-- Apply through Supabase SQL editor or CLI. All browser access is denied.
create table public.guest_sessions(id uuid primary key default gen_random_uuid(),token_hash text unique not null,created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '1 year');
create table public.products(id uuid primary key default gen_random_uuid(),pack_id text unique not null,title text not null,price_vnd integer not null check(price_vnd>0),price_version integer not null default 1,active boolean not null default true);
create table public.orders(id uuid primary key default gen_random_uuid(),guest_id uuid not null references guest_sessions,product_id uuid not null references products,pack_id text not null,amount_vnd integer not null check(amount_vnd>0),title_snapshot text not null,price_version integer not null,payment_code text unique not null,status text not null default 'pending' check(status in ('pending','paid','review_required','refunded')),created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '15 minutes',paid_at timestamptz);
create table public.order_requests(guest_id uuid references guest_sessions,idempotency_key text,order_id uuid not null references orders,primary key(guest_id,idempotency_key));
create table public.payment_events(id uuid primary key default gen_random_uuid(),provider text not null default 'sepay',provider_transaction_id text not null,order_id uuid references orders,amount bigint not null,bank_transaction_at timestamptz not null,received_at timestamptz not null default now(),processing_status text not null,unique(provider,provider_transaction_id));
create table public.purchases(id uuid primary key default gen_random_uuid(),order_id uuid unique not null references orders,pack_id text not null,status text not null default 'active' check(status in ('active','refunded')),recovery_hash text unique not null,recovery_ciphertext text not null,created_at timestamptz not null default now());
create table public.entitlements(id uuid primary key default gen_random_uuid(),guest_id uuid not null references guest_sessions,purchase_id uuid not null references purchases,pack_id text not null,granted_at timestamptz not null default now(),revoked_at timestamptz,unique(guest_id,purchase_id));
create table public.audit_events(id bigint generated always as identity primary key,kind text not null,order_id uuid references orders,guest_id uuid references guest_sessions,created_at timestamptz not null default now());
create table public.rate_limits(key text primary key,bucket timestamptz not null,count integer not null);
create index rate_limits_bucket_idx on rate_limits(bucket);
create index orders_guest_idx on orders(guest_id,pack_id);
create index entitlements_guest_idx on entitlements(guest_id);

create function public.take_rate_limit(p_key text,p_limit integer) returns boolean language plpgsql security definer set search_path=public as $$
declare n integer; begin
 insert into rate_limits(key,bucket,count) values(p_key,date_trunc('minute',now()),1)
 on conflict(key) do update set bucket=excluded.bucket,count=case when rate_limits.bucket=excluded.bucket then rate_limits.count+1 else 1 end returning count into n;
 return n<=p_limit;
end $$;

create function public.create_order(p_guest uuid,p_pack text,p_key text,p_code text) returns jsonb language plpgsql security definer set search_path=public as $$
declare o orders; p products; begin
 -- Serialize all create/retry requests for one guest, including different idempotency keys.
 perform 1 from guest_sessions where id=p_guest and expires_at>now() for update;
 if not found then raise exception 'invalid guest'; end if;
 select orders.* into o from order_requests join orders on orders.id=order_requests.order_id where order_requests.guest_id=p_guest and idempotency_key=p_key;
 if found then
   if o.pack_id<>p_pack then return jsonb_build_object('error','conflict'); end if;
   return to_jsonb(o);
 end if;
 if exists(select 1 from entitlements e join purchases owned on owned.id=e.purchase_id where e.guest_id=p_guest and e.pack_id=p_pack and e.revoked_at is null and owned.status='active') then return jsonb_build_object('alreadyOwned',true); end if;
 select * into p from products where pack_id=p_pack and active for share;
 if not found then return jsonb_build_object('error','unavailable'); end if;
 select * into o from orders where guest_id=p_guest and pack_id=p_pack and status='pending' and expires_at>now() order by created_at desc limit 1;
 if not found then
 insert into orders(guest_id,product_id,pack_id,amount_vnd,title_snapshot,price_version,payment_code) values(p_guest,p.id,p_pack,p.price_vnd,p.title,p.price_version,p_code) returning * into o;
 end if;
 insert into order_requests values(p_guest,p_key,o.id);
 return to_jsonb(o);
end $$;

create function public.apply_payment(p_transaction text,p_code text,p_amount bigint,p_bank_time timestamptz,p_direction text,p_account_valid boolean,p_recovery_hash text,p_recovery_ciphertext text) returns text language plpgsql security definer set search_path=public as $$
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
   if exists(select 1 from entitlements e join purchases owned on owned.id=e.purchase_id where e.guest_id=o.guest_id and e.pack_id=o.pack_id and e.revoked_at is null and owned.status='active') then
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

create function public.restore_purchase(p_guest uuid,p_hash text) returns text language plpgsql security definer set search_path=public as $$
declare p purchases; begin
 perform 1 from guest_sessions where id=p_guest and expires_at>now();if not found then raise exception 'invalid guest';end if;
 select * into p from purchases where recovery_hash=p_hash and status='active' for update;
 if not found then return null; end if;
 insert into entitlements(guest_id,purchase_id,pack_id) values(p_guest,p.id,p.pack_id) on conflict(guest_id,purchase_id) do nothing;
 insert into audit_events(kind,order_id,guest_id) values('purchase_restored',p.order_id,p_guest);
 return p.pack_id;
end $$;

-- No anon/authenticated policies. Only server-side service_role can access commerce.
do $$ declare t text; begin foreach t in array array['guest_sessions','products','orders','order_requests','payment_events','purchases','entitlements','audit_events','rate_limits'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon, authenticated',t);execute format('grant all on public.%I to service_role',t);end loop;end $$;
revoke all on function public.take_rate_limit(text,integer),public.create_order(uuid,text,text,text),public.apply_payment(text,text,bigint,timestamptz,text,boolean,text,text),public.restore_purchase(uuid,text) from public,anon,authenticated;
grant execute on function public.take_rate_limit(text,integer),public.create_order(uuid,text,text,text),public.apply_payment(text,text,bigint,timestamptz,text,boolean,text,text),public.restore_purchase(uuid,text) to service_role;
insert into products(pack_id,title,price_vnd) values('friends-premium','Bạn bè gắn kết',30000),('couples-premium','Đôi mình',30000);

revoke all on sequence public.audit_events_id_seq from public, anon, authenticated;
grant usage, select on sequence public.audit_events_id_seq to service_role;

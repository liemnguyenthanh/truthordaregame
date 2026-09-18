create table public.ai_generations(
 id uuid primary key default gen_random_uuid(),guest_id uuid not null references guest_sessions,idempotency_key text not null,input_hash text not null,ip_hash text not null,input jsonb not null,
 status text not null default 'pending' check(status in ('pending','complete','failed')),output jsonb,error_code text,model text not null,
 input_tokens integer,output_tokens integer,total_tokens integer,duration_ms integer,estimated_cost_usd numeric,created_at timestamptz not null default now(),finished_at timestamptz,
 unique(guest_id,idempotency_key)
);
create index ai_generations_guest_created on ai_generations(guest_id,created_at desc);
create index ai_generations_ip_created on ai_generations(ip_hash,created_at desc);
alter table ai_generations enable row level security;
revoke all on ai_generations from public,anon,authenticated;
grant all on ai_generations to service_role;
create function public.reserve_generation(p_guest uuid,p_key text,p_hash text,p_ip text,p_input jsonb,p_model text,p_daily_limit integer,p_ip_limit integer,p_global_limit integer) returns jsonb language plpgsql security definer set search_path=public as $$
declare existing ai_generations; count_guest integer; count_ip integer; count_global integer; day_start timestamptz;
begin
 if p_daily_limit<1 or p_daily_limit>100 or p_ip_limit<1 or p_ip_limit>1000 or p_global_limit<1 or p_global_limit>10000 then raise exception 'invalid quota';end if;
 -- Serialize shared IP cap and guest reservation. No LLM call until this transaction commits.
 perform pg_advisory_xact_lock(hashtextextended('ai-global-reservation',0));
 perform 1 from guest_sessions where id=p_guest and expires_at>now() for update;
 if not found then raise exception 'invalid guest';end if;
 update ai_generations set status='failed',error_code='timeout',finished_at=now() where guest_id=p_guest and status='pending' and created_at<now()-interval '90 seconds';
 select * into existing from ai_generations where guest_id=p_guest and idempotency_key=p_key;
 if found then
 if existing.input_hash<>p_hash then return jsonb_build_object('error','conflict');end if;
 return jsonb_build_object('created',false,'generation',to_jsonb(existing));end if;
 if exists(select 1 from ai_generations where guest_id=p_guest and status='pending') then return jsonb_build_object('error','active');end if;
 day_start:=date_trunc('day',now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
 select count(*) into count_guest from ai_generations where guest_id=p_guest and created_at>=day_start;
 select count(*) into count_ip from ai_generations where ip_hash=p_ip and created_at>=day_start;
 select count(*) into count_global from ai_generations where created_at>=day_start;
 if count_guest>=p_daily_limit or count_ip>=p_ip_limit or count_global>=p_global_limit then return jsonb_build_object('error','quota');end if;
 insert into ai_generations(guest_id,idempotency_key,input_hash,ip_hash,input,model) values(p_guest,p_key,p_hash,p_ip,p_input,p_model) returning * into existing;
 return jsonb_build_object('created',true,'generation',to_jsonb(existing));
end $$;
revoke all on function public.reserve_generation(uuid,text,text,text,jsonb,text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.reserve_generation(uuid,text,text,text,jsonb,text,integer,integer,integer) to service_role;

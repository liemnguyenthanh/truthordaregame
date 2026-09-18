-- Run after migration against a test database. Always rolls back test data.
begin;
set local role service_role;
do $$
declare guest uuid; stranger uuid; result jsonb; retry jsonb; first_order uuid; outcome text; n integer; recovery text;
begin
 insert into guest_sessions(token_hash) values('integration-test-'||gen_random_uuid()) returning id into guest;
 insert into guest_sessions(token_hash) values('integration-test-'||gen_random_uuid()) returning id into stranger;
 result:=create_order(guest,'friends-premium','test-request-0001','TOD0000000001');
 first_order:=(result->>'id')::uuid;
 retry:=create_order(guest,'friends-premium','test-request-0001','TOD0000000002');
 assert retry->>'id'=result->>'id','idempotency key must reuse order';
 retry:=create_order(guest,'friends-premium','test-request-0002','TOD0000000003');
 assert retry->>'id'=result->>'id','pending reuse must prevent duplicate QR';
 retry:=create_order(guest,'couples-premium','test-request-0001','TOD0000000004');
 assert retry->>'error'='conflict','key must not switch products';
 outcome:=apply_payment('test-'||first_order,'TOD0000000001',(result->>'amount_vnd')::bigint,now(),'in',true,'test-hash-'||guest,'test-cipher');
 assert outcome='paid','valid event must pay';
 outcome:=apply_payment('test-'||first_order,'TOD0000000001',(result->>'amount_vnd')::bigint,now(),'in',true,'other-hash','other-cipher');
 assert outcome='duplicate','same event must be idempotent';
 select count(*) into n from purchases where order_id=first_order;
 assert n=1,'one purchase per order';
 recovery:=restore_purchase(stranger,'test-hash-'||guest);
 assert recovery='friends-premium','restore shares purchase';
 select count(*) into n from entitlements e join purchases p on e.purchase_id=p.id where p.order_id=first_order;
 assert n=2,'two devices one purchase';
 result:=create_order(guest,'couples-premium','test-request-0003','TOD0000000005');
 outcome:=apply_payment('test-wrong-'||guest,'TOD0000000005',1,now(),'in',true,'test-wrong-hash','test-cipher');
 assert outcome='review_required','wrong amount never opens entitlement';
 select count(*) into n from purchases where order_id=(result->>'id')::uuid;
 assert n=0,'wrong amount must not create purchase';
end $$;
reset role;
-- Inject a downstream failure: the event must roll back with the entitlement.
create function public.test_fail_entitlement() returns trigger language plpgsql as $$ begin raise exception 'injected entitlement failure'; end $$;
create trigger test_fail_entitlement before insert on entitlements for each row execute function test_fail_entitlement();
do $$
declare g uuid; o jsonb; n integer; outcome text;
begin
 insert into guest_sessions(token_hash) values('rollback-test-'||gen_random_uuid()) returning id into g;
 o:=create_order(g,'friends-premium','rollback-request-01','TOD0000000006');
 begin
  perform apply_payment('rollback-event','TOD0000000006',(o->>'amount_vnd')::bigint,now(),'in',true,'rollback-hash','cipher');
  raise exception 'expected entitlement trigger to reject';
 exception when others then
  if sqlerrm <> 'injected entitlement failure' then raise; end if;
 end;
 select count(*) into n from payment_events where provider_transaction_id='rollback-event';
 assert n=0,'downstream failure must roll back event receipt';
 execute 'drop trigger test_fail_entitlement on entitlements';
 outcome:=apply_payment('rollback-event','TOD0000000006',(o->>'amount_vnd')::bigint,now(),'in',true,'rollback-hash','cipher');
 assert outcome='paid','retry must succeed after rollback';
 assert not has_table_privilege('anon','orders','select'),'anon cannot read orders';
 assert not has_table_privilege('authenticated','orders','insert'),'authenticated cannot forge orders';
 assert not has_function_privilege('anon','public.apply_payment(text,text,bigint,timestamptz,text,boolean,text,text)','execute'),'anon cannot grant paid';
 assert has_sequence_privilege('service_role','audit_events_id_seq','usage'),'service role can append audit';
 assert (select relrowsecurity from pg_class where oid='public.orders'::regclass),'RLS enabled';
 assert take_rate_limit('test-limit',1),'first rate request allowed';
 assert not take_rate_limit('test-limit',1),'second request limited';
end $$;
rollback;

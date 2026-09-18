-- The hosted project's RLS event trigger is internal, not a public RPC.
-- Skip on local databases where this platform helper does not exist.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

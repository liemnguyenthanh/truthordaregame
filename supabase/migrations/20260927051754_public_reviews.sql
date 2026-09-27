-- The primary-key B-tree supports ORDER BY id DESC and id < cursor without OFFSET.
create table public.reviews (
  id integer generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  comment text not null check (char_length(btrim(comment)) between 1 and 1000),
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
-- Anonymous visitors use the validated Next.js API; database writes stay server-side.
revoke all on public.reviews from anon, authenticated;
grant select, insert on public.reviews to service_role;
grant usage on sequence public.reviews_id_seq to service_role;

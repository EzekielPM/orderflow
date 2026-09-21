create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  business_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  merchant_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null default '',
  item_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  delivery_address text not null default '',
  channel text not null default 'WhatsApp',
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Payment received', 'Out for delivery', 'Delivered', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists public_token uuid not null default gen_random_uuid();
create unique index if not exists orders_public_token_key on public.orders (public_token);
alter table public.orders add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'paid', 'failed', 'refunded'));
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists paid_at timestamptz;
create unique index if not exists orders_payment_reference_key
  on public.orders (payment_reference) where payment_reference is not null;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  merchant_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'paystack',
  reference text not null unique,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'NGN',
  channel text not null default '',
  status text not null check (status in ('success', 'failed', 'refunded')),
  paid_at timestamptz,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_merchant_id_idx on public.payments (merchant_id);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;

drop policy if exists "Profiles are private" on public.profiles;
create policy "Profiles are private" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Merchants manage their orders" on public.orders;
create policy "Merchants manage their orders" on public.orders
for all using (auth.uid() = merchant_id) with check (auth.uid() = merchant_id);

drop policy if exists "Merchants view their payments" on public.payments;
create policy "Merchants view their payments" on public.payments
for select using (auth.uid() = merchant_id);

revoke insert, update, delete on public.payments from anon, authenticated;

create or replace function public.get_public_order(p_token uuid)
returns table (
  order_number text,
  customer_name text,
  customer_phone text,
  item_name text,
  quantity integer,
  unit_price numeric,
  delivery_fee numeric,
  delivery_address text,
  status text,
  created_at timestamptz,
  merchant_business text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.order_number,
    o.customer_name,
    o.customer_phone,
    o.item_name,
    o.quantity,
    o.unit_price,
    o.delivery_fee,
    o.delivery_address,
    o.status,
    o.created_at,
    coalesce(p.business_name, 'OrderFlow merchant')
  from public.orders o
  left join public.profiles p on p.id = o.merchant_id
  where o.public_token = p_token
  limit 1;
$$;

create or replace function public.confirm_public_order(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = 'Confirmed', updated_at = now()
  where public_token = p_token and status = 'Pending';
  return found;
end;
$$;

revoke all on function public.get_public_order(uuid) from public;
revoke all on function public.confirm_public_order(uuid) from public;
grant execute on function public.get_public_order(uuid) to anon, authenticated;
grant execute on function public.confirm_public_order(uuid) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

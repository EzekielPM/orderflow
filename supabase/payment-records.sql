alter table public.orders
add column if not exists payment_status text not null default 'unpaid'
check (payment_status in ('unpaid', 'paid', 'failed', 'refunded'));

alter table public.orders
add column if not exists payment_reference text;

alter table public.orders
add column if not exists paid_at timestamptz;

create unique index if not exists orders_payment_reference_key
on public.orders (payment_reference)
where payment_reference is not null;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  merchant_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'paystack',
  reference text not null unique,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'NGN',
  channel text not null default '',
  status text not null
    check (status in ('success', 'failed', 'refunded')),
  paid_at timestamptz,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx
on public.payments (order_id);

create index if not exists payments_merchant_id_idx
on public.payments (merchant_id);

alter table public.payments enable row level security;

drop policy if exists "Merchants view their payments"
on public.payments;

create policy "Merchants view their payments"
on public.payments
for select
using (auth.uid() = merchant_id);

revoke insert, update, delete
on public.payments
from anon, authenticated;

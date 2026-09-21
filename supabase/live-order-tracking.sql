create or replace function public.get_public_order_tracking(p_token uuid)
returns table (
  status text,
  updated_at timestamptz,
  payment_status text,
  merchant_phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.status,
    o.updated_at,
    o.payment_status,
    coalesce(p.phone, '')
  from public.orders o
  left join public.profiles p
    on p.id = o.merchant_id
  where o.public_token = p_token
  limit 1;
$$;

revoke all
on function public.get_public_order_tracking(uuid)
from public;

grant execute
on function public.get_public_order_tracking(uuid)
to anon, authenticated;

-- TradeFlow product catalogue image access.
-- Run this in the Supabase SQL Editor for the project used by the deployed app.
-- Product photos are intended to be publicly viewable in buyer catalogues.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set public = true;

drop policy if exists "Public can view TradeFlow product images" on storage.objects;
create policy "Public can view TradeFlow product images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Vendors upload their own TradeFlow product images" on storage.objects;
create policy "Vendors upload their own TradeFlow product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

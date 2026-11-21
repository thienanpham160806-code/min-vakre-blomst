-- Chạy sau 0001; có thể chạy lại an toàn.
create or replace function public.unlock_info()
returns table (unlock_at timestamptz, server_now timestamptz)
language sql stable security definer set search_path = public as $$
  -- Công khai duy nhất thời điểm mở quà và giờ máy chủ.
  select s.unlock_at, now() from public.settings s where s.id = 1;
$$;
revoke all on function public.unlock_info() from public;
grant execute on function public.unlock_info() to anon, authenticated;

alter table public.album_items add column if not exists drive_url text;
alter table public.album_items add column if not exists drive_name text;
alter table public.album_items drop constraint if exists album_items_kind_check;
alter table public.album_items add constraint album_items_kind_check
  check (kind in ('photo', 'video', 'sticker', 'text', 'drive'));

alter table public.settings add column if not exists finale_occasion_id uuid
  references public.occasions(id) on delete set null;

create table if not exists public.gift_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now()
);
alter table public.gift_progress enable row level security;
drop policy if exists gift_progress_read on public.gift_progress;
create policy gift_progress_read on public.gift_progress for select to authenticated
  using (user_id = auth.uid() and public.can_view());
drop policy if exists gift_progress_insert on public.gift_progress;
create policy gift_progress_insert on public.gift_progress for insert to authenticated
  with check (user_id = auth.uid() and public.can_view());
drop policy if exists gift_progress_update on public.gift_progress;
create policy gift_progress_update on public.gift_progress for update to authenticated
  using (user_id = auth.uid() and public.can_view())
  with check (user_id = auth.uid() and public.can_view());
grant select, insert, update on public.gift_progress to authenticated;

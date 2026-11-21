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

create or replace function public.plant_wish(
  wish_id uuid, title text, happened_on date, flower text, color text, background text
) returns uuid language plpgsql security definer set search_path = public as $$
declare w public.wishes; planted uuid;
begin
  if not public.can_view() then raise exception 'Không có quyền trồng hoa'; end if;
  select * into w from public.wishes where id = wish_id for update;
  if not found then raise exception 'Không tìm thấy điều ước'; end if;
  if w.occasion_id is not null then return w.occasion_id; end if;
  if w.done_at is null then raise exception 'Điều ước chưa hoàn thành'; end if;
  if nullif(btrim(title), '') is null or happened_on is null
    or flower is null or flower not in ('tulip','daisy','rose','sunflower','lavender')
    or color is null or color !~ '^#[0-9A-Fa-f]{6}$'
    or background is null or background not in ('kraft','grid','dots','blush','night')
  then raise exception 'Thông tin bông hoa không hợp lệ'; end if;
  insert into public.occasions(title, happened_on, flower, color, background)
    values (btrim(title), happened_on, flower, color, background) returning id into planted;
  update public.wishes set occasion_id = planted where id = wish_id;
  return planted;
end;
$$;
revoke all on function public.plant_wish(uuid,text,date,text,text,text) from public;
grant execute on function public.plant_wish(uuid,text,date,text,text,text) to authenticated;

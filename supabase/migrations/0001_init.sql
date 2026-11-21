-- min vakre blomst — schema khởi tạo
-- Chạy file này trong Supabase Dashboard → SQL Editor (hoặc `supabase db push`).

-- ───────────────────────── Thành viên ─────────────────────────
-- Chỉ 2 người được vào web. Tài khoản tạo trong Authentication → Users,
-- sau đó thêm vào bảng members (xem README).
create table if not exists public.members (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role         text not null check (role in ('owner', 'partner')),
  email        text,
  created_at   timestamptz not null default now()
);

-- Cài đặt chung (chỉ 1 dòng, id = 1)
create table if not exists public.settings (
  id             int primary key default 1 check (id = 1),
  unlock_at      timestamptz not null default '2027-01-18 00:00:00+07',
  together_since date,
  updated_at     timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict do nothing;

-- ───────────────────────── Hàm phân quyền ─────────────────────────
create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where user_id = auth.uid());
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where user_id = auth.uid() and role = 'owner');
$$;

-- Owner vào được bất cứ lúc nào (để chuẩn bị). Partner chỉ vào được sau unlock_at.
create or replace function public.can_view()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_owner()
      or (public.is_member() and now() >= (select unlock_at from public.settings where id = 1));
$$;

-- ───────────────────────── Dịp / trang album ─────────────────────────
create table if not exists public.occasions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  happened_on date not null,
  description text,
  flower      text not null default 'tulip',      -- tulip | daisy | rose | sunflower | lavender
  color       text not null default '#f7a8c4',
  background  text not null default 'kraft',      -- kraft | grid | dots | blush | night
  created_by  uuid references auth.users(id) default auth.uid(),
  created_at  timestamptz not null default now()
);

-- Mỗi món trên trang scrapbook: ảnh, video, sticker, chữ
create table if not exists public.album_items (
  id           uuid primary key default gen_random_uuid(),
  occasion_id  uuid not null references public.occasions(id) on delete cascade,
  kind         text not null check (kind in ('photo', 'video', 'sticker', 'text')),
  storage_path text,                 -- ảnh/video/sticker tự up
  content      text,                 -- chữ, hoặc mã sticker có sẵn (vd "builtin:heart")
  x            real not null default 500,   -- toạ độ tâm trên khung 1000 x 1400
  y            real not null default 700,
  width        real not null default 400,
  rotation     real not null default 0,     -- độ
  z            int  not null default 0,
  style        jsonb not null default '{}'::jsonb,
  created_by   uuid references auth.users(id) default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists album_items_occasion_idx on public.album_items (occasion_id);

-- ───────────────────────── Thư "Mở khi..." ─────────────────────────
create table if not exists public.letters (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,            -- "Mở khi buồn", "Sinh nhật 2027"...
  body       text not null,
  open_at    timestamptz,              -- null = mở được ngay
  is_birthday boolean not null default false,
  author     uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

-- ───────────────────────── Thiệp mời ─────────────────────────
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  message     text,
  event_at    timestamptz,
  dress_code  text,
  options     jsonb not null default '[]'::jsonb,  -- [{ "name": "...", "note": "...", "emoji": "🍣" }]
  chosen      int,                                 -- index trong options
  answered_at timestamptz,
  is_birthday boolean not null default false,
  created_by  uuid references auth.users(id) default auth.uid(),
  created_at  timestamptz not null default now()
);

-- ───────────────────────── Phiếu ưu đãi ─────────────────────────
create table if not exists public.coupons (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  emoji       text not null default '🎟️',
  created_by  uuid references auth.users(id) default auth.uid(),
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ───────────────────────── Điều ước chung ─────────────────────────
create table if not exists public.wishes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  done_at     timestamptz,
  occasion_id uuid references public.occasions(id) on delete set null,
  created_by  uuid references auth.users(id) default auth.uid(),
  created_at  timestamptz not null default now()
);

-- ───────────────────────── Mail hẹn giờ ─────────────────────────
-- Chỉ owner thấy. Endpoint /api/cron/mails gửi các mail tới hạn.
create table if not exists public.scheduled_mails (
  id         uuid primary key default gen_random_uuid(),
  to_email   text not null,
  subject    text not null,
  heading    text,
  body       text not null,
  send_at    timestamptz not null,
  sent_at    timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── RLS ─────────────────────────
alter table public.members         enable row level security;
alter table public.settings        enable row level security;
alter table public.occasions       enable row level security;
alter table public.album_items     enable row level security;
alter table public.letters         enable row level security;
alter table public.invitations     enable row level security;
alter table public.coupons         enable row level security;
alter table public.wishes          enable row level security;
alter table public.scheduled_mails enable row level security;

-- members: mỗi thành viên đọc được danh sách 2 người
create policy members_read on public.members for select using (public.is_member());

-- settings: thành viên đọc (để biết giờ mở khoá), owner sửa
create policy settings_read  on public.settings for select using (public.is_member());
create policy settings_write on public.settings for update using (public.is_owner()) with check (public.is_owner());

-- Nhóm bảng dùng chung: ai trong 2 người cũng thêm/sửa/xoá được (sau giờ mở khoá)
do $$
declare t text;
begin
  foreach t in array array['occasions', 'album_items', 'coupons', 'wishes'] loop
    execute format('create policy %1$s_read   on public.%1$s for select using (public.can_view())', t);
    execute format('create policy %1$s_insert on public.%1$s for insert with check (public.can_view())', t);
    execute format('create policy %1$s_update on public.%1$s for update using (public.can_view()) with check (public.can_view())', t);
    execute format('create policy %1$s_delete on public.%1$s for delete using (public.can_view())', t);
  end loop;
end $$;

-- letters: người viết luôn thấy; người nhận chỉ thấy khi tới ngày mở
create policy letters_read on public.letters for select
  using (public.can_view() and (author = auth.uid() or open_at is null or open_at <= now()));
create policy letters_insert on public.letters for insert with check (public.can_view() and author = auth.uid());
create policy letters_update on public.letters for update using (author = auth.uid()) with check (author = auth.uid());
create policy letters_delete on public.letters for delete using (author = auth.uid());

-- Cho người nhận thấy "phong bì đang khoá" (chỉ tiêu đề + ngày mở, không lộ nội dung)
create or replace function public.locked_letters()
returns table (id uuid, title text, open_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.title, l.open_at from public.letters l
  where public.can_view() and l.author <> auth.uid() and l.open_at > now()
  order by l.open_at;
$$;

-- invitations: cả hai đọc; người nhận được trả lời (cập nhật chosen)
create policy invitations_read   on public.invitations for select using (public.can_view());
create policy invitations_insert on public.invitations for insert with check (public.can_view());
create policy invitations_update on public.invitations for update using (public.can_view()) with check (public.can_view());
create policy invitations_delete on public.invitations for delete using (created_by = auth.uid());

-- scheduled_mails: chỉ owner
create policy mails_owner on public.scheduled_mails for all using (public.is_owner()) with check (public.is_owner());

-- ───────────────────────── Storage ─────────────────────────
-- Bucket riêng tư, chỉ 2 người đọc/ghi. Ảnh hiển thị qua signed URL.
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;

create policy memories_read on storage.objects for select
  using (bucket_id = 'memories' and public.can_view());
create policy memories_insert on storage.objects for insert
  with check (bucket_id = 'memories' and public.can_view());
create policy memories_update on storage.objects for update
  using (bucket_id = 'memories' and public.can_view());
create policy memories_delete on storage.objects for delete
  using (bucket_id = 'memories' and public.can_view());

-- ───────────────────────── Realtime (cho bản sau: 2 người cùng dán sticker) ─────────────────────────
alter publication supabase_realtime add table public.album_items;

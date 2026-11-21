-- Chạy sau 0001; có thể chạy lại an toàn.
create or replace function public.unlock_info()
returns table (unlock_at timestamptz, server_now timestamptz)
language sql stable security definer set search_path = public as $$
  -- Công khai duy nhất thời điểm mở quà và giờ máy chủ.
  select s.unlock_at, now() from public.settings s where s.id = 1;
$$;
revoke all on function public.unlock_info() from public;
grant execute on function public.unlock_info() to anon, authenticated;

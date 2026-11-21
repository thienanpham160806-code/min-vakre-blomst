-- Chạy sau 0002; có thể chạy lại an toàn.
-- Mở rộng danh sách loài hoa (8 loại) và mẫu giấy scrapbook (12 mẫu) trong RPC plant_wish.

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
    or flower is null or flower not in ('tulip','daisy','rose','sunflower','lavender','peony','camellia','poppy')
    or color is null or color !~ '^#[0-9A-Fa-f]{6}$'
    or background is null or background not in ('ivory','kraft','grid','dots','lined','torn','botanical','sage','blush','linen','gingham','night')
  then raise exception 'Thông tin bông hoa không hợp lệ'; end if;
  insert into public.occasions(title, happened_on, flower, color, background)
    values (btrim(title), happened_on, flower, color, background) returning id into planted;
  update public.wishes set occasion_id = planted where id = wish_id;
  return planted;
end;
$$;
revoke all on function public.plant_wish(uuid,text,date,text,text,text) from public;
grant execute on function public.plant_wish(uuid,text,date,text,text,text) to authenticated;

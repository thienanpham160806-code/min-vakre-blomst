-- Nội dung mẫu cho sinh nhật 18/01/2027.
-- Chạy SAU khi đã tạo 2 tài khoản và thêm vào bảng members (xem README).
-- Thay mọi chỗ <<...>> trước khi chạy. Sửa lại sau trong web cũng được.

-- Thời điểm mở khoá + ngày bắt đầu yêu nhau
update public.settings
set unlock_at = '2027-01-18 00:00:00+07',
    together_since = '<<YYYY-MM-DD ngày quen nhau>>'
where id = 1;

-- Lá thư sinh nhật (hiện sau khi mở phong bì)
insert into public.letters (title, body, open_at, is_birthday, author)
values (
  'Gửi bông hoa xinh đẹp của tui',
  '<<Viết thư ở đây. Xuống dòng bình thường, web giữ nguyên định dạng.>>',
  '2027-01-18 00:00:00+07',
  true,
  (select user_id from public.members where role = 'owner')
);

-- Thiệp mời đi chơi: ẻm chọn 1 trong các lựa chọn
insert into public.invitations (title, message, event_at, dress_code, options, is_birthday, created_by)
values (
  'Hẹn hò sinh nhật',
  'Tối nay để tui lo hết nha. Chỉ cần chọn chỗ ăn thôi.',
  '2027-01-18 18:30:00+07',
  '<<Gợi ý trang phục, vd: váy trắng>>',
  '[
    {"emoji": "🍣", "name": "<<Quán 1>>", "note": "<<mô tả ngắn>>"},
    {"emoji": "🍝", "name": "<<Quán 2>>", "note": "<<mô tả ngắn>>"},
    {"emoji": "🍲", "name": "<<Quán 3>>", "note": "<<mô tả ngắn>>"}
  ]'::jsonb,
  true,
  (select user_id from public.members where role = 'owner')
);

-- Phiếu ưu đãi tặng kèm
insert into public.coupons (title, description, emoji, created_by)
select t.title, t.description, t.emoji, (select user_id from public.members where role = 'owner')
from (values
  ('Một chầu lẩu không cần lý do', 'Dùng bất cứ lúc nào thèm.', '🍲'),
  ('Một lần thắng cãi nhau', 'Xài là thắng, không được kháng cáo.', '🏆'),
  ('Một buổi đi chơi tuỳ ẻm chọn', 'Đi đâu cũng được, tui chịu hết.', '🎡'),
  ('Một ly trà sữa giao tận nơi', 'Size L, full topping.', '🧋')
) as t(title, description, emoji);

-- Mail gửi đúng 00:00 ngày 18/01
insert into public.scheduled_mails (to_email, subject, heading, body, send_at)
values (
  '<<email của ẻm>>',
  'min vakre blomst',
  'Chúc mừng sinh nhật 🌷',
  'Có một khu vườn đang chờ ẻm mở ra. Mật mã là ngày đặc biệt của tụi mình.',
  '2027-01-18 00:00:00+07'
);

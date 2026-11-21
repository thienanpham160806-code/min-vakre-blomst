# min vakre blomst 🌷

Khu vườn kỷ niệm của hai đứa: mỗi dịp là một bông hoa, bấm vào là mở ra một trang scrapbook để cùng dán ảnh, video, sticker và viết chữ. Ra mắt vào **00:00 ngày 18/01/2027**.

## Có gì trong này

| Trang | Đường dẫn | Mô tả |
|---|---|---|
| Đếm ngược | `/` | Công khai. Trước giờ mở khoá chỉ thấy đồng hồ, tới giờ thì hoa nở và hiện nút “Mở quà”. |
| Đăng nhập | `/login` | Email + mật mã (ví dụ giả: `01/01/2000` hay `01012000` đều được). |
| Mở quà | `/qua` | Phong bì → lá thư sinh nhật → thiệp mời chọn chỗ ăn → vào vườn. |
| Khu vườn | `/vuon` | Mỗi dịp một bông hoa, có bộ đếm “Ngày thứ N của tụi mình”. |
| Album | `/album/[id]` | Trang scrapbook: up ảnh/video, sticker, chữ viết tay; kéo, xoay, chụm 2 ngón để phóng to; đổi khung (polaroid, băng keo, tròn); đổi nền. Hai người cùng sửa thì thấy nhau theo thời gian thực. |
| Hộp thư | `/thu` | Thư “Mở khi…”, hẹn giờ mở; người nhận thấy phong bì khoá kèm ngày mở. |
| Phiếu ưu đãi | `/phieu` | Tặng phiếu cho nhau; bấm “Dùng” là web gửi mail báo người tặng. |
| Điều ước | `/uoc` | Danh sách việc muốn cùng làm. |
| Cài đặt | `/cai-dat` | Chỉ bro thấy: giờ mở khoá, ngày yêu nhau, thiệp mời, mail hẹn giờ, xem trước màn mở quà. |

**Công nghệ:** Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Auth, Postgres + RLS, Storage, Realtime) · Gmail SMTP qua nodemailer (mail) · deploy Vercel.

**Bảo mật:** chỉ 2 tài khoản trong bảng `members` vào được. Mọi quyền được kiểm ở DB bằng Row Level Security. Ẻm (role `partner`) **không đọc được gì trước giờ mở khoá** kể cả khi biết mật mã; bro (role `owner`) vào lúc nào cũng được để chuẩn bị. Ảnh/video nằm trong bucket riêng tư, chỉ hiện qua link có hạn 1 tiếng.

---

## Cài đặt từng bước

### 1. Supabase
1. Tạo project tại <https://supabase.com> (chọn region Singapore cho gần).
2. **SQL Editor** → dán toàn bộ `supabase/migrations/0001_init.sql` → Run. Sau đó chạy `supabase/migrations/0002_garden_updates.sql`. Với DB đã có dữ liệu, chỉ chạy 0002; migration này có thể chạy lại an toàn.
3. **Authentication → Sign In / Providers → Email**: tắt *Allow new users to sign up* (để người lạ không tự tạo tài khoản được).
4. **Authentication → Users → Add user** (tick *Auto Confirm User*), tạo 2 tài khoản:
   - Của bro: email + mật khẩu tuỳ ý.
   - Của ẻm: email thật của ẻm, mật khẩu dạng `ddmmyyyy` (ví dụ giả: `01012000`).
5. Lấy `id` của 2 user vừa tạo rồi chạy:
   ```sql
   insert into public.members (user_id, display_name, role, email) values
     ('<id-của-bro>', 'An',  'owner',   '<email-của-bro>'),
     ('<id-của-ẻm>',  '<tên ẻm>', 'partner', '<email-của-ẻm>');
   ```
6. (Tuỳ chọn) Sửa các chỗ `<<...>>` trong `supabase/seed_birthday.sql` rồi chạy để có sẵn thư, thiệp mời, phiếu và mail sinh nhật. Hoặc tạo dần trong web.

### 2. Gmail (gửi mail, miễn phí)
1. Bật *Xác minh 2 bước* cho tài khoản Google sẽ dùng để gửi.
2. Vào <https://myaccount.google.com/apppasswords>, tạo một *Mật khẩu ứng dụng* (16 ký tự).
3. Đặt `GMAIL_USER=<gmail đó>` và `GMAIL_APP_PASSWORD=<16 ký tự>`. Mail sẽ gửi từ chính Gmail này tới bất kỳ ai, tối đa khoảng 500 mail/ngày.

### 3. Chạy ở máy
```bash
cp .env.example .env.local   # điền các giá trị
npm install
npm run dev                  # http://localhost:3000
```

### 4. Deploy lên Vercel
1. Import repo này trên <https://vercel.com>.
2. Thêm toàn bộ biến trong `.env.example` vào *Settings → Environment Variables* (đặt `NEXT_PUBLIC_SITE_URL` là địa chỉ thật).
3. (Tuỳ chọn) Gắn tên miền riêng ở *Settings → Domains*.

### 5. Hẹn giờ gửi mail
Endpoint `/api/cron/mails` gửi mọi mail trong bảng `scheduled_mails` đã tới giờ. Cần thứ gì đó gọi nó định kỳ:
- **Khuyên dùng:** tạo job miễn phí trên <https://cron-job.org> gọi `GET https://<web>/api/cron/mails` **mỗi 5 phút**, thêm header `Authorization: Bearer <CRON_SECRET>`. Mail 00:00 sẽ tới trong vòng 5 phút.
- `vercel.json` đã có sẵn một cron Vercel chạy mỗi ngày lúc 00:00 giờ VN để dự phòng (gói Hobby chỉ cho chạy 1 lần/ngày và có thể lệch giờ, nên đừng dựa hoàn toàn vào nó).

---

## Lộ trình tới 18/01

| Thời gian | Việc |
|---|---|
| 21/11 – 30/11 | Dựng Supabase, Vercel, Gmail. Đăng nhập thử bằng tài khoản owner. |
| 01/12 – 21/12 | Chỉnh giao diện theo gu hai đứa, thêm sticker tự vẽ, làm sticker từ ảnh mặt hai đứa. |
| 22/12 – 04/01 | Gom ảnh cũ, tạo các bông hoa cho những dịp đã qua, trang trí từng trang. |
| **05/01** | **Chốt tính năng.** Từ đây chỉ thêm nội dung và sửa lỗi. |
| 05/01 – 15/01 | Viết thư sinh nhật, thiệp mời, phiếu, hẹn mail 00:00. Test kỹ trên điện thoại (cả iPhone lẫn Android nếu được). |
| 16/01 – 17/01 | Tạo tài khoản ẻm, thử đăng nhập bằng tài khoản đó với giờ mở khoá tạm đặt sớm hơn, rồi đặt lại về 18/01 00:00. Kiểm tra mail đã nằm trong lịch gửi. |

## Ý tưởng cho các bản sau
- Lật trang như sách thật cho mỗi năm (“Năm thứ nhất”, “Năm thứ hai”).
- Tự xoá nền ảnh để làm sticker ngay trên web.
- Vẽ nguệch ngoạc trực tiếp lên trang.
- Bản đồ những nơi đã đi cùng nhau.
- Thả cảm xúc và bình luận nhỏ dưới từng ảnh.
- Quiz “hiểu tui bao nhiêu”, playlist chung.

## Lưu ý
- **Dung lượng:** gói miễn phí Supabase hạn chế dung lượng lưu trữ và mỗi tệp tối đa 50MB. Ảnh được nén tự động trước khi up; video nên nén trước (vd bằng app CapCut, xuất 720p).
- **Sao lưu:** thỉnh thoảng tải bucket `memories` và export DB về máy. Mất kỷ niệm là buồn lắm.
- **Đổi giờ mở khoá:** sửa ở `/cai-dat` là có hiệu lực ngay; đồng hồ lấy `settings.unlock_at` qua RPC `unlock_info`, không cần deploy lại.
- **Gia hạn tên miền** mỗi năm.

## Cấu trúc thư mục
```
src/
  app/
    page.tsx, countdown.tsx   # đếm ngược
    login/                    # đăng nhập
    qua/                      # màn mở quà sinh nhật
    vuon/                     # khu vườn
    album/[id]/               # trang scrapbook (scrapbook.tsx là trình chỉnh sửa)
    thu/ phieu/ uoc/ cai-dat/
    api/coupons/redeem/       # dùng phiếu + mail báo
    api/cron/mails/           # gửi mail hẹn giờ
  components/                 # Flower, stickers, AppShell, Sheet
  lib/                        # supabase client, kiểu dữ liệu, upload ảnh, mail
  proxy.ts                    # làm mới phiên đăng nhập, chặn trang khi chưa đăng nhập
supabase/
  migrations/0001_init.sql    # bảng, RLS, storage
  seed_birthday.sql           # nội dung mẫu cho sinh nhật
```

## Gắn file Google Drive
Upload lên Drive → Chia sẻ → **Bị hạn chế** → thêm đúng email Google của người kia → Sao chép đường liên kết → mở album, Trang trí → Drive → dán link và đặt tên hiển thị.
Chỉ nhận link file `https://drive.google.com/file/d/<id>/view` hoặc `/open?id=<id>`; không nhận folder hay Google Docs. Web chỉ lưu liên kết, không tải hay nhúng file. Xoá thẻ không xoá file Drive. Video vượt 50MB có nút “Gắn từ Google Drive”.

## Kiểm tra
`npm run lint`, `npm run test`, `npm run build`. Unit test dùng Vitest cho liên kết Drive và đồng hồ theo giờ máy chủ.
Owner chọn album ở “Bông hoa ở màn kết” trong Cài đặt. Điều ước hoàn thành có thể trồng hoa trực tiếp; RPC khoá dòng để thử lại không tạo hai album.

Trên Supabase thật sau khi chạy 0002:

- **Owner:** chạy lại 0002 để kiểm tra tính lặp; kiểm tra `unlock_info` với anon chỉ trả hai trường, người ngoài không đọc được dữ liệu riêng. Đặt `unlock_at` sớm tạm thời, giữ trang đếm ngược mở để thử rồi đặt lại giờ ban đầu. Owner vẫn vào được trước giờ mở. Chọn/bỏ album màn kết; đi hết bản xem trước và xác nhận `invitations`, `gift_progress` không đổi. Thử lỗi lưu cài đặt và scrapbook, xoá bản nhân bản, hoàn tác trong 6 giây và xoá cả album có file dùng chung. Đóng trang trong thời gian hoàn tác sẽ giữ file để tránh mất ảnh; có thể còn file thừa.
- **Partner:** trước giờ mở phải bị chặn cả giao diện lẫn RLS; để trang sẵn qua mốc phải vào được. Chọn quán chưa ghi DB; “Nhận lời” mới ghi, lỗi vẫn ở thiệp. Kết thúc mới ghi tiến độ; đăng nhập lại vào vườn, xem lại quà chỉ đọc và giữ quán đã chốt. Thử Drive với đúng email Google được chia sẻ; thử ảnh/video/sticker và kéo/xoay trên điện thoại. Trồng hoa từ điều ước hoàn thành, gửi lặp/thử đồng thời ở hai tab phải chỉ có một album. Không đọc/ghi được tiến độ của tài khoản khác.

Mock HTTP không thực thi Postgres/RLS, khoá giao dịch hay chia sẻ Google Drive; các bước trên cần xác minh bằng tài khoản thật.

**Mật mã ví dụ `01012000` / `01/01/2000` hoàn toàn là giả.** Nếu mật mã thật từng xuất hiện trong repo/README, hãy đổi mật khẩu tài khoản đó tại Supabase → Authentication → Users (xoá ví dụ khỏi README không xoá lịch sử Git).

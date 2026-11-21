# min vakre blomst 🌷

Khu vườn kỷ niệm của hai đứa: mỗi dịp là một bông hoa, bấm vào là mở ra một trang scrapbook để cùng dán ảnh, video, sticker và viết chữ. Ra mắt vào **00:00 ngày 18/01/2027**.

## Có gì trong này

| Trang | Đường dẫn | Mô tả |
|---|---|---|
| Đếm ngược | `/` | Công khai. Trước giờ mở khoá chỉ thấy đồng hồ, tới giờ thì hoa nở và hiện nút “Mở quà”. |
| Đăng nhập | `/login` | Email + mật mã (mật mã của ẻm là ngày đặc biệt, gõ `18/01/2024` hay `18012024` đều được). |
| Mở quà | `/qua` | Phong bì → lá thư sinh nhật → thiệp mời chọn chỗ ăn → vào vườn. |
| Khu vườn | `/vuon` | Mỗi dịp một bông hoa, có bộ đếm “Ngày thứ N của tụi mình”. |
| Album | `/album/[id]` | Trang scrapbook: up ảnh/video, sticker, chữ viết tay; kéo, xoay, chụm 2 ngón để phóng to; đổi khung (polaroid, băng keo, tròn); đổi nền. Hai người cùng sửa thì thấy nhau theo thời gian thực. |
| Hộp thư | `/thu` | Thư “Mở khi…”, hẹn giờ mở; người nhận thấy phong bì khoá kèm ngày mở. |
| Phiếu ưu đãi | `/phieu` | Tặng phiếu cho nhau; bấm “Dùng” là web gửi mail báo người tặng. |
| Điều ước | `/uoc` | Danh sách việc muốn cùng làm. |
| Cài đặt | `/cai-dat` | Chỉ bro thấy: giờ mở khoá, ngày yêu nhau, thiệp mời, mail hẹn giờ, xem trước màn mở quà. |

**Công nghệ:** Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Auth, Postgres + RLS, Storage, Realtime) · Resend (mail) · deploy Vercel.

**Bảo mật:** chỉ 2 tài khoản trong bảng `members` vào được. Mọi quyền được kiểm ở DB bằng Row Level Security. Ẻm (role `partner`) **không đọc được gì trước giờ mở khoá** kể cả khi biết mật mã; bro (role `owner`) vào lúc nào cũng được để chuẩn bị. Ảnh/video nằm trong bucket riêng tư, chỉ hiện qua link có hạn 1 tiếng.

---

## Cài đặt từng bước

### 1. Supabase
1. Tạo project tại <https://supabase.com> (chọn region Singapore cho gần).
2. **SQL Editor** → dán toàn bộ `supabase/migrations/0001_init.sql` → Run.
3. **Authentication → Sign In / Providers → Email**: tắt *Allow new users to sign up* (để người lạ không tự tạo tài khoản được).
4. **Authentication → Users → Add user** (tick *Auto Confirm User*), tạo 2 tài khoản:
   - Của bro: email + mật khẩu tuỳ ý.
   - Của ẻm: email thật của ẻm, mật khẩu = ngày đặc biệt dạng `ddmmyyyy` (vd `14032025`).
5. Lấy `id` của 2 user vừa tạo rồi chạy:
   ```sql
   insert into public.members (user_id, display_name, role, email) values
     ('<id-của-bro>', 'An',  'owner',   '<email-của-bro>'),
     ('<id-của-ẻm>',  '<tên ẻm>', 'partner', '<email-của-ẻm>');
   ```
6. (Tuỳ chọn) Sửa các chỗ `<<...>>` trong `supabase/seed_birthday.sql` rồi chạy để có sẵn thư, thiệp mời, phiếu và mail sinh nhật. Hoặc tạo dần trong web.

### 2. Resend (gửi mail)
1. Tạo tài khoản <https://resend.com>, lấy API key.
2. ⚠️ Địa chỉ mặc định `onboarding@resend.dev` **chỉ gửi được tới email của chính bro**. Muốn gửi cho ẻm thì phải mua tên miền và xác minh trong *Domains* (thêm vài bản ghi DNS), rồi đặt `MAIL_FROM=min vakre blomst <hoa@ten-mien-cua-bro.com>`.

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
| 21/11 – 30/11 | Dựng Supabase, Vercel, Resend + tên miền. Đăng nhập thử bằng tài khoản owner. |
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
- **Đổi giờ mở khoá:** sửa ở `/cai-dat` **và** biến `NEXT_PUBLIC_UNLOCK_AT` (rồi deploy lại) để đồng hồ đếm ngược khớp.
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

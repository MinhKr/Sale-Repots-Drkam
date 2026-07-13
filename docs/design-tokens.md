# Design Tokens — Sales Report DrKam

> Bảng màu **thương hiệu thật của DrKam**, trích từ CSS website [drkam.vn](https://drkam.vn) (`flatsome-child/style.css`, đếm theo tần suất sử dụng). Primary là **ĐỎ**, thay thế bảng xanh dương trong file kế hoạch dev bản 2.

## 1. Màu neo thương hiệu (brand anchors)

| Vai trò | Hex | Ghi chú |
|---------|-----|---------|
| Primary — Đỏ DrKam | `#D32027` | Màu chủ đạo, nút chính, tên thương hiệu |
| Primary đậm | `#B70F1B` | Footer, heading, hover nút đỏ |
| Accent — Cam | `#FD6E1D` | Nút phụ, CTA, highlight |
| Gold — Vàng hổ phách | `#F59000` | Badge, nhấn số liệu |
| Success — Xanh lá | `#01A14F` | Trạng thái "đạt", tick y khoa |
| Warning — Vàng | `#FFC107` | Cảnh báo nhẹ |
| Text chính | `#4D4D4D` | Chữ body |
| Nền | `#FFFFFF` | Nền trang |

## 2. Thang màu đầy đủ (dùng trực tiếp cho `tailwind.config.ts`)

### primary (đỏ) — neo ở 500 = #D32027, 600 = #B70F1B
```
50:  #FEF2F2
100: #FCE0E1
200: #F7BEC1
300: #EF9297
400: #E25058
500: #D32027   ← brand đỏ
600: #B70F1B   ← brand đỏ đậm (hover/footer)
700: #971018
800: #7A1218
900: #5E0F14
```

### accent (cam) — neo ở 500 = #FD6E1D
```
50:  #FFF6ED
100: #FFE9D5
200: #FED0AA
300: #FDB174
400: #FD8A3C
500: #FD6E1D   ← brand cam
600: #E85A0C
700: #C0470A
```

### gold (vàng hổ phách) — highlight số liệu
```
400: #FFB020
500: #F59000   ← brand vàng
600: #D97706
```

### Màu ngữ nghĩa (semantic)
```
success: 50 #ECFDF3 · 500 #01A14F · 600 #017A3C   (brand xanh lá)
warning: 50 #FFF8E1 · 500 #FFC107 · 600 #D9A406
danger:  50 #FEF2F2 · 500 #E11D48 · 600 #BE123C   (xem lưu ý bên dưới)
```

### Màu trung tính (slate — giữ như hệ Tailwind)
```
900 #0F172A  Text chính (heading đậm)
800 #1F2937  Heading
700 #4D4D4D  Text body (brand)
500 #6B7280  Text phụ, label
300 #D1D5DB  Border, divider
100 #F3F4F6  Row hover, section bg
50  #F8FAFC  Nền body
```

## 3. Lưu ý quan trọng về màu Danger

Vì **primary đã là đỏ**, không thể dùng đỏ cho cả nút chính lẫn nút "xoá/nguy hiểm" (người dùng sẽ nhầm). Giải pháp:
- **Nút chính (default):** nền `primary-500` (#D32027), hover `primary-600`.
- **Nút xoá (destructive):** dùng `danger-500` = **rose #E11D48** (đỏ hồng, hơi lệch tông) HOẶC kiểu outline đỏ để phân biệt rõ với nút chính.

## 4. Áp dụng vào component (kế thừa style guide phần 3.4 của kế hoạch)

| Thành phần | Style |
|-----------|-------|
| Button default | nền `accent-500` cam **hoặc** `primary-500` đỏ, chữ trắng — *chốt với PM* |
| Button secondary | nền `primary-700`, chữ trắng |
| Button outline | viền `slate-300`, chữ `slate-800` |
| Ô nhập báo cáo (vàng) | `bg-yellow-100 border-accent-500` |
| Ô tự tính (readonly) | `bg-primary-50 text-slate-700 cursor-not-allowed` |
| Table header | `bg-primary-700 text-white sticky top-0` |
| Số tiền | `text-right font-mono tabular-nums` |
| Badge Đạt | `bg-success-50 text-success-600 rounded-full` |
| Badge Gần đạt | `bg-warning-50 text-warning-600 rounded-full` |
| Badge Yếu/chưa nhập | `bg-primary-50 text-primary-600 rounded-full` |

> Các thang 50–900 (ngoài màu neo brand) được nội suy để đủ sắc độ; có thể tinh chỉnh khi vào code. Font theo kế hoạch: heading **Montserrat**, body **Inter**, số **mono tabular-nums**.

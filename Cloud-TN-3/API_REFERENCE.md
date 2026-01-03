# Teknav Stage 2 API Reference

این سند خلاصه‌ای از APIهای مهمی است که در بک‌اند NestJS پیاده‌سازی شده است. همهٔ پاسخ‌ها JSON هستند مگر خلاف آن ذکر شود.

## احراز هویت

### POST `/auth/login`
بدنه:
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```
پاسخ موفق:
```json
{
  "accessToken": "<JWT>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "WRITER",
    "name": "نام"
  }
}
```

## کاربران
همهٔ مسیرهای زیر نیازمند هدر Authorization با مقدار `Bearer <token>` هستند.

### GET `/users`
- دسترسی: نقش ADMIN به بالا
- شرح: فهرست تمام کاربران.

### POST `/users`
- دسترسی: نقش OWNER
- بدنه: مشابه `CreateUserDto`

### PATCH `/users/:id`
- دسترسی: نقش ADMIN به بالا
- بدنه: فیلدهای اختیاری برای ویرایش.

### DELETE `/users/:id`
- دسترسی: نقش OWNER

## مقالات

### POST `/articles`
- دسترسی: WRITER به بالا
- بدنه: عنوان، خلاصه، محتوا، برچسب‌ها و دسته‌بندی.
- خروجی: شیء مقاله با وضعیت اولیه (OWNER → PUBLISH، سایرین → PENDING)

### GET `/articles`
- دسترسی: WRITER به بالا
- پارامتر اختیاری `status`
- برمی‌گرداند مقالات مرتبط با کاربر (نویسنده فقط نوشته‌های خودش را می‌بیند).

### GET `/articles/public`
- دسترسی: عمومی
- پارامتر اختیاری `status` (پیش‌فرض PUBLISH)

### PATCH `/articles/:id`
- دسترسی: WRITER به بالا
- امکان ویرایش عنوان/خلاصه/محتوا.

### PATCH `/articles/:id/approve`
- دسترسی: ADMIN به بالا
- انتشار مقاله.

### PATCH `/articles/:id/reject`
- دسترسی: ADMIN به بالا
- بدنه اختیاری `{ "reason": "متن" }`

## اعتبارسنجی هوش مصنوعی

### POST `/ai/validate`
- دسترسی: WRITER به بالا
- نرخ مجاز: ۱۰ درخواست در بازه RATE_LIMIT_WINDOW_MS برای هر کاربر/IP
- بدنه: `{ "content": "..." }`
- خروجی: امتیازات SEO، اصالت، ساختار و احتمال هوش مصنوعی.

## GraphQL
- آدرس: `/graphql`
- از Bearer Token استفاده کنید.

نمونه کوئری برای گرفتن وضعیت مقاله‌ها:
```graphql
query MyArticles($status: String) {
  myArticles(status: $status) {
    id
    title
    status
    aiReports {
      seoScore
      aiProbability
      feedback
      createdAt
    }
  }
}
```

## سلامت
- GET `/health` → `{ "ok": true, "service": "teknav-backend" }`

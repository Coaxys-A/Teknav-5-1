# Teknav Backend (NestJS)

این سرویس هسته‌ی Stage 2 تکناو است که با NestJS، GraphQL، REST، Prisma و صف اعتبارسنجی هوش مصنوعی ساخته شده است. این پروژه APIهایی برای مدیریت کاربران، مقالات، گزارش‌های هوش مصنوعی و ارتباط با WordPress فراهم می‌کند.

## راه‌اندازی سریع

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

## امکانات کلیدی
- احراز هویت JWT با نقش‌های OWNER، ADMIN، WRITER و GUEST
- رفرش توکن مبتنی بر سشن با ذخیره‌ی هش در دیتابیس و کش Redis
- GraphQL (Apollo) و REST به صورت هم‌زمان
- Prisma + PostgreSQL با اسکیما آماده
- صف درون‌حافظه‌ای برای اجرای وظایف اعتبارسنجی محتوا توسط مدل‌های OpenRouter
- ارتباط با WordPress/WooCommerce از طریق ماژول اختصاصی
- گزارش‌های AI و سیاست‌های رد خودکار محتوا بر اساس امتیازات

### نقاط انتهایی اصلی احراز هویت
- `POST /auth/login` (دریافت accessToken، refreshToken، sessionId)
- `POST /auth/refresh` (چرخش رفرش توکن و صدور accessToken جدید)
- `POST /auth/logout` (ابطال سشن فعال؛ نیازمند توکن دسترسی)

## ساختار پوشه‌ها
```
src/
  main.ts
  app.module.ts
  common/
  auth/
  users/
  articles/
  ai-validation/
  wordpress/
  prisma/
  graphql/
```

## تست و تحلیل
- `npm run test`
- `npm run lint`
- `npm run build`

## سلامت و مانیتورینگ
- GET `/health` برای بررسی وضعیت سرور

## پیکربندی
مقادیر لازم در `.env.example` مستند شده‌اند. کلید OpenRouter باید فقط در سمت سرور نگهداری شود.

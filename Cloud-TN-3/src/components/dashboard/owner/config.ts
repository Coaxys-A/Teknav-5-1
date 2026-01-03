import { NavGroup, NavItem } from './types';

/**
 * Owner Navigation Configuration
 *
 * Static navigation configuration for Owner Dashboard.
 * Includes Security (RBAC, Logs, Sessions, Devices, Bans) pages.
 */

export const OWNER_NAV_ITEMS: NavGroup[] = [
  {
    title: 'مدیریت',
    items: [
      {
        href: '/dashboard/owner',
        label: 'نمای کلی',
        description: 'آمار و وضعیت سیستم',
      },
      {
        href: '/dashboard/owner/analytics',
        label: 'آنالیتیکس',
        description: 'عملکرد و تراکد پلتفرم',
      },
      {
        href: '/dashboard/owner/articles',
        label: 'مقالات',
        description: 'مدیریت محتوای منتشر شده',
      },
      {
        href: '/dashboard/owner/users',
        label: 'کاربران',
        description: 'مدیریت دسترسی‌ها و نقش‌ها',
      },
    ],
  },
  {
    title: 'هوش مصنوعی',
    items: [
      {
        href: '/dashboard/owner/ai/event-logs',
        label: 'لاگ‌های رویدادهای AI',
        description: 'تاریخچه کامل درخواست‌ها و پاسخ‌های هوش مصنوعی',
      },
      {
        href: '/dashboard/owner/ai/runs',
        label: 'اجرای AI',
        description: 'مدیریت و مشاهده اجراهای AI',
      },
      {
        href: '/dashboard/owner/ai/tasks',
        label: 'تسک‌های AI',
        description: 'لیست تسک‌های AI و وضعیت آن‌ها',
      },
    ],
  },
  {
    title: 'ورک‌فلوها',
    items: [
      {
        href: '/dashboard/owner/workflows/instances',
        label: 'نمونه‌های اجرای ورک‌فلو',
        description: 'مدیریت و مشاهده نمونه‌های اجرای ورک‌فلو',
      },
    ],
  },
  {
    title: 'امنیت (Security)',
    items: [
      {
        href: '/dashboard/owner/security/rbac',
        label: 'مدیریت دسترسی (RBAC)',
        description: 'مدیریت نقش‌ها و دسترسی‌ها',
        badge: 'جدید',
      },
      {
        href: '/dashboard/owner/security/sessions',
        label: 'مدیریت نشست‌ها',
        description: 'نشست‌های فعال کاربران',
        badge: 'جدید',
      },
      {
        href: '/dashboard/owner/security/devices',
        label: 'مدیریت دستگاه‌ها',
        description: 'دستگاه‌های ثبت شده و اعتماد',
        badge: 'جدید',
      },
      {
        href: '/dashboard/owner/security/audit-logs',
        label: 'لاگ‌های امنیتی',
        description: 'رویدادهای امنیتی و سیستم',
        badge: 'جدید',
      },
      {
        href: '/dashboard/owner/security/access-logs',
        label: 'لاگ‌های دسترسی',
        description: 'دسترسی‌های حساس به داده‌ها',
        badge: 'جدید',
      },
      {
        href: '/dashboard/owner/security/bans-rate-limits',
        label: 'محدودیت‌ها و بن‌ها',
        description: 'مدیریت محدودیت‌های نرخ و بن‌ها',
        badge: 'جدید',
      },
    ],
  },
  {
    title: 'فروشگاه',
    items: [
      {
        href: '/dashboard/owner/store',
        label: 'فروشگاه',
        description: 'مدیریت اشتراک‌ها و محصولات',
      },
    ],
  },
  {
    title: 'پلاگین‌ها',
    items: [
      {
        href: '/dashboard/owner/plugins',
        label: 'افزونه‌ها',
        description: 'مدیریت و نصب پلاگین‌ها',
      },
      {
        href: '/dashboard/owner/settings',
        label: 'تنظیمات',
        description: 'پیکربندی‌های پلتفرم',
      },
    ],
  },
];

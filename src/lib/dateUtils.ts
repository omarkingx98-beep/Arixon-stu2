/**
 * Date and time formatting utility for Arabic locale (Palestine / Jordan)
 */

export function formatDate(dateInput?: string | number | Date | null, options?: Intl.DateTimeFormatOptions): string {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    const defaultOptions: Intl.DateTimeFormatOptions = options || {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    return new Intl.DateTimeFormat('ar-EG', defaultOptions).format(date);
  } catch {
    return String(dateInput);
  }
}

export const formatArabicDate = formatDate;

export function formatDateTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

export function formatRelativeTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    const now = Date.now();
    const diffInSeconds = Math.floor((now - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'منذ لحظات';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `منذ ${diffInDays} يوم`;
    return formatDate(date);
  } catch {
    return '';
  }
}

export function safeFormatDate(
  dateInput?: string | number | Date | null,
  locale = 'ar-EG',
  options?: Intl.DateTimeFormatOptions,
  fallback = ''
): string {
  if (!dateInput) return fallback;
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return fallback;
    return new Intl.DateTimeFormat(locale, options || { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  } catch {
    return fallback;
  }
}

export function safeFormatDateTime(
  dateInput?: string | number | Date | null,
  locale = 'ar-EG',
  options?: Intl.DateTimeFormatOptions,
  fallback = ''
): string {
  if (!dateInput) return fallback;
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return fallback;
    return new Intl.DateTimeFormat(locale, options || {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return fallback;
  }
}

export function safeGetTime(dateInput?: string | number | Date | null): number {
  if (!dateInput) return 0;
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    const time = date.getTime();
    return isNaN(time) ? 0 : time;
  } catch {
    return 0;
  }
}

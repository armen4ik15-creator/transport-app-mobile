import type { PeriodFilter } from '../constants/expenseTypes';

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getPeriodBounds(period: PeriodFilter): { from?: string; to?: string } {
  const now = new Date();
  const fmt = (date: Date) => date.toISOString().slice(0, 10);
  const today = fmt(now);

  switch (period) {
    case 'today':
      return { from: today, to: today };
    case 'week': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { from: fmt(start), to: today };
    }
    case 'month':
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    case 'quarter': {
      const month = Math.floor(now.getMonth() / 3) * 3;
      return { from: fmt(new Date(now.getFullYear(), month, 1)), to: today };
    }
    case 'year':
      return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: today };
    default:
      return {};
  }
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

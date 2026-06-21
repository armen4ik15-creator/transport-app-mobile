export type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year';

export const PERIOD_LABELS: Record<PeriodFilter, string> = {
  all: 'Всё',
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
  quarter: 'Квартал',
  year: 'Год',
};

export const PERIOD_FILTERS: PeriodFilter[] = [
  'all',
  'today',
  'week',
  'month',
  'quarter',
  'year',
];

export interface ExpenseTypeOption {
  value: string;
  label: string;
  icon: string;
}

export const ALL_EXPENSE_TYPES: ExpenseTypeOption[] = [
  { value: 'fuel_card', label: 'Пополнение топл. карты', icon: '💳' },
  { value: 'fuel', label: 'Топливо по карте', icon: '⛽' },
  { value: 'repair', label: 'Ремонт/Шиномонтаж', icon: '🔧' },
  { value: 'parts', label: 'Запчасти/Шины', icon: '🔩' },
  { value: 'maintenance', label: 'ТО и сервис', icon: '🛠' },
  { value: 'platon', label: 'Платон', icon: '🛣' },
  { value: 'wash', label: 'Мойка', icon: '🚿' },
  { value: 'toll', label: 'Платные дороги', icon: '🏁' },
  { value: 'fine', label: 'Штрафы', icon: '⚠️' },
  { value: 'dps', label: 'ДПС', icon: '🚔' },
  { value: 'supplies', label: 'Мелкие расходники', icon: '🧰' },
  { value: 'lease', label: 'Аренда/Лизинг', icon: '🏢' },
  { value: 'bank_fee', label: 'Банковские комиссии', icon: '🏦' },
  { value: 'other', label: 'Прочие расходы', icon: '📦' },
  { value: 'salary_other', label: 'Зарплата (прочая)', icon: '👤' },
  { value: 'dividend', label: 'Дивиденды', icon: '💰' },
];

export const DRIVER_EXPENSE_CATEGORIES: ExpenseTypeOption[] = [
  { value: 'dps', label: 'ДПС', icon: '🚔' },
  { value: 'toll', label: 'Платная дорога', icon: '🏁' },
  { value: 'supplies', label: 'Мелкие расходники', icon: '🧰' },
  { value: 'other', label: 'Другое', icon: '📦' },
];

export const EXPENSE_STATUS_LABEL: Record<string, string> = {
  pending: 'На проверке',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};

export function getExpenseStatusLabel(value: string | null | undefined): string {
  if (!value) return EXPENSE_STATUS_LABEL.approved;
  return EXPENSE_STATUS_LABEL[value] ?? value;
}

export function getExpenseTypeLabel(value: string): string {
  return ALL_EXPENSE_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function getExpenseTypeIcon(value: string): string {
  return ALL_EXPENSE_TYPES.find((item) => item.value === value)?.icon ?? '📦';
}

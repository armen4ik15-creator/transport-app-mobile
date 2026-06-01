export type ContractorRoleFilter = 'all' | 'customer' | 'supplier';

export type ContractorApiType = 'company' | 'individual' | 'gov';

export const CONTRACTOR_ROLE_FILTER_ITEMS = [
  { id: 'all' as const, label: 'Все' },
  { id: 'customer' as const, label: 'Заказчики' },
  { id: 'supplier' as const, label: 'Поставщики' },
];

export function contractorRoleFromApiType(type: string): 'customer' | 'supplier' {
  if (type === 'individual') return 'supplier';
  return 'customer';
}

export function matchesContractorRoleFilter(type: string, filter: ContractorRoleFilter): boolean {
  if (filter === 'all') return true;
  return contractorRoleFromApiType(type) === filter;
}

export function contractorTypeBadgeLabel(type: string): string {
  if (type === 'individual') return 'Поставщик';
  if (type === 'gov') return 'Госорган';
  return 'Заказчик';
}

export function contractorTypeBadgeColor(type: string): string {
  if (type === 'individual') return '#f59e0b';
  if (type === 'gov') return '#7c3aed';
  return '#2563eb';
}

export function apiTypeFromFormRole(role: 'customer' | 'supplier' | 'gov'): ContractorApiType {
  if (role === 'supplier') return 'individual';
  if (role === 'gov') return 'gov';
  return 'company';
}

export function formRoleFromApiType(type: string): 'customer' | 'supplier' | 'gov' {
  if (type === 'individual') return 'supplier';
  if (type === 'gov') return 'gov';
  return 'customer';
}

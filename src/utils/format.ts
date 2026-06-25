/** Форматирование сумм как в v0 kit.tsx */
export function rub(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(Math.round(value));
  const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  return `${sign}${grouped}\u202f₽`;
}

export function initialsFromName(name?: string | null): string {
  if (!name?.trim()) return 'RP';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function trendPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

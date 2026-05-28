import type { TripRecord } from '../types';

function escapeCsv(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value);
  if (/[",;\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildRegistryCsv(rows: TripRecord[]): string {
  const header = [
    'ID рейса',
    'ID заказа',
    'Дата',
    'Водитель',
    'Машина',
    'ТТН',
    'Объём',
  ].join(';');

  const body = rows.map((row) =>
    [
      row.id,
      row.order_id,
      row.created_at,
      row.driver_name ?? '',
      row.driver_car_number ?? '',
      row.ttn_number ?? '',
      row.volume ?? '',
    ]
      .map(escapeCsv)
      .join(';')
  );

  return `\uFEFF${[header, ...body].join('\n')}`;
}

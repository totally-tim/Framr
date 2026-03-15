import type { DateStampFormat } from '../types';

export const DATE_STAMP_FORMATS: { value: DateStampFormat; label: string; example: string }[] = [
  { value: 'japanese', label: "'YY MM DD", example: "'90 12 25" },
  { value: 'american', label: 'MM/DD/YYYY', example: '12/25/1990' },
  { value: 'european', label: 'DD.MM.YYYY', example: '25.12.1990' },
];

export function formatDateStamp(date: Date, format: DateStampFormat): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  switch (format) {
    case 'japanese':
      return `'${String(y).slice(2)} ${m} ${d}`;
    case 'american':
      return `${m}/${d}/${y}`;
    case 'european':
      return `${d}.${m}.${y}`;
  }
}

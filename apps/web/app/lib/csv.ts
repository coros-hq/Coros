export type CSVColumn<T> = {
  key: string;
  label: string;
  format?: (value: unknown, row: T) => string;
};

function getValueByKeyPath(obj: unknown, keyPath: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  if (!keyPath) return undefined;
  return keyPath.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function escapeCSVCell(raw: string): string {
  const needsQuoting = /[",\n\r]/.test(raw);
  if (!needsQuoting) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

export function convertToCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: CSVColumn<T>[]
): string {
  const header = columns.map((c) => escapeCSVCell(String(c.label ?? ''))).join(',');

  const lines = rows.map((row) => {
    return columns
      .map((col) => {
        const value = getValueByKeyPath(row, col.key);
        const formatted = col.format ? col.format(value, row) : normalizeCellValue(value);
        return escapeCSVCell(formatted);
      })
      .join(',');
  });

  // BOM for Excel compatibility
  return `\uFEFF${[header, ...lines].join('\n')}`;
}

export function downloadCSV(csvString: string, filename: string) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Give the browser a tick to start the download
  setTimeout(() => URL.revokeObjectURL(url), 0);
}


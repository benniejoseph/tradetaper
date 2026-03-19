const FORMULA_PREFIX_PATTERN = /^[\s]*[=+\-@]/;

function normalizeCsvCell(value: unknown): string {
  const raw = value == null ? '' : String(value);
  if (FORMULA_PREFIX_PATTERN.test(raw)) {
    return `'${raw}`;
  }
  return raw;
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildCsvContent(
  headers: string[],
  rows: Array<Array<unknown>>,
): string {
  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(normalizeCsvCell(cell))).join(','))
    .join('\n');
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<unknown>>,
): void {
  const csvContent = buildCsvContent(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

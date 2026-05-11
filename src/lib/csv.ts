export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  const text = String(value).replace(/"/g, '""');

  if (/[",\n\r]/.test(text)) {
    return `"${text}"`;
  }

  return text;
}

export function csvLine(values: unknown[]): string {
  return values.map(escapeCsvValue).join(",");
}

export function blankLine(): string {
  return "";
}

export function sectionTitle(title: string): string {
  return csvLine([title]);
}

export function keyValueLine(label: string, value: unknown): string {
  return csvLine([label, value]);
}

export function table<T extends Record<string, unknown>>(
  headers: { key: keyof T; label: string }[],
  rows: T[],
): string[] {
  const lines: string[] = [];

  lines.push(csvLine(headers.map((header) => header.label)));

  for (const row of rows) {
    lines.push(csvLine(headers.map((header) => row[header.key])));
  }

  return lines;
}

export function buildCsvReport(lines: string[]): string {
  return "\uFEFF" + lines.join("\r\n");
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

// Keep the old type and toCsv function so we don't break the Users export immediately
export type CsvHeader<T extends Record<string, unknown>> = {
  key: keyof T;
  label: string;
};

export function toCsv<T extends Record<string, unknown>>(
  headers: CsvHeader<T>[],
  rows: T[],
): string {
  return buildCsvReport(table(headers, rows));
}

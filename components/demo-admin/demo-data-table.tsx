import type { ReactNode } from 'react';
import type { DemoDataTableColumn, DemoDataTableRow } from './demo-panel';

export type { DemoDataTableColumn, DemoDataTableRow };

type DemoDataTableProps = {
  columns?: readonly DemoDataTableColumn[];
  headings?: readonly string[];
  rows: readonly DemoDataTableRow[] | ReadonlyArray<readonly ReactNode[]>;
};

function normalizeRows(rows: DemoDataTableProps['rows']): readonly DemoDataTableRow[] {
  const normalized: DemoDataTableRow[] = [];
  for (const row of rows) {
    if (!Array.isArray(row)) {
      normalized.push(row as DemoDataTableRow);
      continue;
    }
    normalized.push(Object.fromEntries(row.map((cell, index) => [String(index), cell])) as DemoDataTableRow);
  }
  return normalized;
}

export function DemoDataTable({ columns: inputColumns, headings, rows }: DemoDataTableProps) {
  const columns = inputColumns ?? (headings ?? []).map((label, index) => ({ key: String(index), label }));
  const normalizedRows = normalizeRows(rows);

  return (
    <div className="demo-admin-table-wrap">
      <table className="demo-admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {normalizedRows.map((row, rowIndex) => (
            <tr key={String(row.id ?? rowIndex)}>
              {columns.map((column) => (
                <td key={column.key}>{row[column.key] ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

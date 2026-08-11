import type { ReactNode } from 'react';
import { AdminPanel } from '@/components/admin/admin-panel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table';

export function DemoDataTable({
  title,
  note,
  headings,
  rows,
}: {
  title?: string;
  note?: string;
  headings: readonly string[];
  rows: ReadonlyArray<readonly ReactNode[]>;
}) {
  return (
    <AdminPanel title={title} note={note}>
      <div className="overflow-hidden rounded-[20px] border border-admin-outline-variant">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              {headings.map((heading) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((cells, rowIndex) => (
              <TableRow key={rowIndex}>
                {cells.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} className="font-medium">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminPanel>
  );
}

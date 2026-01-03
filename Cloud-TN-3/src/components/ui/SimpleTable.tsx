import React from "react";

type ColumnDef = { key: string; header: string; render?: (row: any) => React.ReactNode };

type SimpleTableProps = {
  columns: (string | ColumnDef)[];
  rows?: any[] | (string | number)[][];
  data?: any[];
  emptyText?: string;
};

export function SimpleTable({ columns, rows, data, emptyText = "بدون داده" }: SimpleTableProps) {
  const isStringColumns = typeof columns[0] === "string";
  const normalizedColumns: ColumnDef[] = isStringColumns
    ? (columns as string[]).map((c, idx) => ({ key: `c${idx}`, header: c }))
    : (columns as ColumnDef[]);

  const sourceRows = data ?? rows ?? [];
  const normalizedRows: any[] = Array.isArray(sourceRows) && sourceRows.length > 0 && Array.isArray(sourceRows[0])
    ? (sourceRows as (string | number)[][]).map((r) => {
        const obj: Record<string, any> = {};
        r.forEach((val, idx) => {
          obj[`c${idx}`] = val;
        });
        return obj;
      })
    : (sourceRows as any[]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
      <table className="min-w-full text-sm text-slate-100">
        <thead className="bg-white/5 text-xs uppercase text-slate-300">
          <tr>
            {normalizedColumns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-right">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {normalizedRows.length === 0 && (
            <tr>
              <td colSpan={normalizedColumns.length} className="px-4 py-5 text-center text-slate-400">
                {emptyText}
              </td>
            </tr>
          )}
          {normalizedRows.map((row, idx) => (
            <tr key={idx} className="border-t border-white/5 hover:bg-white/5">
              {normalizedColumns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SimpleTable;

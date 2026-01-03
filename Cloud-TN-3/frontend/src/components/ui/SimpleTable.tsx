import React from 'react';

type Props = {
  columns: string[];
  rows: (string | number)[][];
};

export default function SimpleTable({ columns, rows }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-right text-sm">
        <thead>
          <tr className="text-slate-500">
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
              {row.map((cell, i) => (
                <td key={i} className="px-3 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

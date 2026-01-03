'use client';

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Filter, MoreHorizontal, RefreshCw, Search, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  id: string;
  label: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  hidden?: boolean;
};

export type DataTableProps<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPaginate: (page: number) => void;
  onSort: (sort: string | undefined) => void;
  columns: Column<T>[];
  search?: string;
  onSearch?: (value: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string;
  emptyLabel?: string;
};

export function DataTable<T>({
  data,
  total,
  page,
  pageSize,
  onPaginate,
  onSort,
  columns,
  search,
  onSearch,
  onRefresh,
  loading,
  error,
  emptyLabel,
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<string | undefined>();
  const [visible, setVisible] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.id]: !col.hidden }), {}),
  );
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [showCols, setShowCols] = useState(false);

  const rows = useMemo(() => data ?? [], [data]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    const next =
      !sortState || !sortState.startsWith(`${col.id}:`)
        ? `${col.id}:asc`
        : sortState.endsWith(":asc")
        ? `${col.id}:desc`
        : undefined;
    setSortState(next);
    onSort(next);
  };

  const toggleAll = (checked: boolean) => {
    const record: Record<number, boolean> = {};
    if (checked) rows.forEach((_, idx) => (record[idx] = true));
    setSelected(record);
  };

  const toggleOne = (idx: number, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [idx]: checked }));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {onSearch ? (
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search ?? ""}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search"
                className="pl-8"
              />
            </div>
          ) : null}
          <Button variant="outline" size="sm" onClick={onRefresh} type="button">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative inline-block">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowCols((s) => !s)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Columns
            </Button>
            {showCols ? (
              <div className="absolute right-0 z-10 mt-2 w-52 rounded-md border bg-popover p-2 shadow">
                <div className="flex items-center justify-between px-1 pb-2 text-xs text-muted-foreground">
                  <span>Toggle columns</span>
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => setShowCols(false)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {columns.map((col) => (
                  <label key={col.id} className="flex items-center gap-2 py-1 text-sm">
                    <Checkbox
                      checked={visible[col.id]}
                      onCheckedChange={(checked) => setVisible((v) => ({ ...v, [col.id]: Boolean(checked) }))}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <Button variant="outline" size="sm" type="button">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  checked={rows.length > 0 && rows.every((_, idx) => selected[idx])}
                  onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                />
              </TableHead>
              {columns
                .filter((c) => visible[c.id])
                .map((col) => (
                  <TableHead
                    key={col.id}
                    className={cn(col.sortable ? "cursor-pointer select-none" : "", "whitespace-nowrap")}
                    onClick={() => toggleSort(col)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortState?.startsWith(`${col.id}:`) ? (
                        sortState.endsWith(":asc") ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : null}
                    </div>
                  </TableHead>
                ))}
              <TableHead className="w-10 text-right">
                <MoreHorizontal className="ml-auto h-4 w-4 text-muted-foreground" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center text-sm text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center text-sm text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center text-sm text-muted-foreground">
                  {emptyLabel ?? "No data"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Checkbox checked={!!selected[idx]} onCheckedChange={(checked) => toggleOne(idx, Boolean(checked))} />
                  </TableCell>
                  {columns
                    .filter((c) => visible[c.id])
                    .map((col) => (
                      <TableCell key={col.id}>{col.accessor(row)}</TableCell>
                    ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" type="button">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages} · {total} records
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPaginate(page - 1)} type="button">
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPaginate(page + 1)}
            type="button"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

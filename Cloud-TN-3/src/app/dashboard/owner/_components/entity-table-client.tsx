'use client';

import { useOptimistic, useTransition } from "react";
import { DataTable, Column } from "./data-table";

type ClientTableProps<T> = {
  initialData: T[];
  total: number;
  page: number;
  pageSize: number;
  columns: Column<T>[];
  onFetch: (params: { page: number; sort?: string; search?: string }) => Promise<{ rows: T[]; total: number; page: number; pageSize: number }>;
};

export function EntityTableClient<T>({ initialData, total, page, pageSize, columns, onFetch }: ClientTableProps<T>) {
  const [state, setState] = useOptimistic({ rows: initialData, total, page, pageSize, sort: undefined as string | undefined, search: "" });
  const [isPending, startTransition] = useTransition();

  const reload = (next: Partial<{ page: number; sort?: string; search?: string }>) => {
    startTransition(async () => {
      const res = await onFetch({
        page: next.page ?? state.page,
        sort: next.sort ?? state.sort,
        search: next.search ?? state.search,
      });
      setState({ ...state, ...res, sort: next.sort ?? state.sort, search: next.search ?? state.search });
    });
  };

  return (
    <DataTable
      data={state.rows}
      total={state.total}
      page={state.page}
      pageSize={state.pageSize}
      onPaginate={(p) => reload({ page: p })}
      onSort={(s) => reload({ sort: s ?? undefined })}
      columns={columns}
      search={state.search}
      onSearch={(v) => reload({ search: v })}
      onRefresh={() => reload({})}
      loading={isPending}
      error={undefined}
      emptyLabel="No records"
    />
  );
}

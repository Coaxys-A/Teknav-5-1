'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function OwnerTableShell<T = any>({
  columns,
  data,
  onRowClick,
  actions,
  selected,
  onSelectAll,
  pageSize,
  page,
  total,
}: {
  columns: { key: string; header: string; cell: (item: T) => React.ReactNode }[];
  data: T[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
  selected?: Set<string>;
  onSelectAll?: () => void;
  pageSize: number;
  page: number;
  total: number;
}) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selected?.size === data.length}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.header}</TableHead>
            ))}
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={(item as any).id || index}
              onClick={() => onRowClick?.(item)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="w-12">
                <Checkbox
                  checked={selected?.has((item as any).id.toString())}
                  onCheckedChange={(checked) => {
                    // TODO: Implement row selection
                  }}
                />
              </TableCell>
              {columns.map((col) => (
                <TableCell key={col.key}>{col.cell(item)}</TableCell>
              ))}
              <TableCell className="w-12">
                {actions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {actions.map((action, i) => (
                        <DropdownMenuItem
                          key={i}
                          onClick={action.onClick}
                          className={action.variant === 'destructive' ? 'text-red-600' : ''}
                        >
                          {action.icon}
                          <span className="ml-2">{action.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {total > 0 && (
        <div className="flex items-center justify-end border-t p-4 gap-2">
          <span className="text-sm text-muted-foreground">
            {Math.min(page * pageSize, total) - (page - 1) * pageSize + 1} of {total}
          </span>
          <Button variant="outline" size="sm">
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

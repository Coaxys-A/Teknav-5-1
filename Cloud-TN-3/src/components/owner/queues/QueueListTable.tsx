'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2, ArrowRight } from 'lucide-react';

/**
 * Queue List Table Component
 *
 * Displays all queues with live stats.
 * Supports:
 * - Sort by stats
 * - Filter by name
 * - Actions: pause/resume/purge
 * - Click row to navigate to queue detail
 */

interface Queue {
  name: string;
  stats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
    workers: number;
    rate: number;
    avgDurationMs: number;
    p95DurationMs: number;
    lastUpdatedAt: Date;
  };
}

interface QueueListTableProps {
  queues: Queue[];
  onAction: (queueName: string, action: 'pause' | 'resume' | 'purge') => void;
  onQueueClick: (queueName: string) => void;
}

export function QueueListTable({ queues, onAction, onQueueClick }: QueueListTableProps) {
  const [sortField, setSortField] = useState<string>('waiting');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sort queues
  const sortedQueues = [...queues].sort((a, b) => {
    const valA = a.stats[sortField as keyof typeof a.stats];
    const valB = b.stats[sortField as keyof typeof b.stats];

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                Queue Name {sortField === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </TableHead>
              <TableHead className="text-center cursor-pointer" onClick={() => handleSort('waiting')}>
                Waiting {sortField === 'waiting' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </TableHead>
              <TableHead className="text-center cursor-pointer" onClick={() => handleSort('active')}>
                Active {sortField === 'active' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </TableHead>
              <TableHead className="text-center cursor-pointer" onClick={() => handleSort('completed')}>
                Completed {sortField === 'completed' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </TableHead>
              <TableHead className="text-center cursor-pointer" onClick={() => handleSort('failed')}>
                Failed {sortField === 'failed' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </TableHead>
              <TableHead className="text-center cursor-pointer" onClick={() => handleSort('delayed')}>
                Delayed {sortField === 'delayed' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </TableHead>
              <TableHead className="text-center">
                Status
              </TableHead>
              <TableHead className="text-center cursor-pointer" onClick={() => handleSort('rate')}>
                Rate {sortField === 'rate' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </TableHead>
              <TableHead className="text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedQueues.map((queue) => (
              <TableRow key={queue.name} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{queue.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{queue.stats.waiting}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{queue.stats.active}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="default">{queue.stats.completed}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="destructive">{queue.stats.failed}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{queue.stats.delayed}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {queue.stats.paused ? (
                    <Badge variant="destructive">Paused</Badge>
                  ) : (
                    <Badge variant="default">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-mono">{queue.stats.rate.toFixed(2)} job/s</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction(queue.name, queue.stats.paused ? 'resume' : 'pause');
                      }}
                    >
                      {queue.stats.paused ? <Play className="h-4 w-4 text-green-600" /> : <Pause className="h-4 w-4 text-yellow-600" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction(queue.name, 'purge');
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

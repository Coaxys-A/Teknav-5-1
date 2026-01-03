'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, Clock, User, Database, Layers } from 'lucide-react';

interface EntityDrawerProps {
  isOpen: boolean;
  entity: any;
  entityType: string;
  title: string;
  onClose: () => void;
}

export function EntityDrawer({
  isOpen,
  entity,
  entityType,
  title,
  onClose,
}: EntityDrawerProps) {
  if (!isOpen) return null;

  const fields = [
    { key: 'id', label: 'ID', value: entity.id },
    { key: 'createdAt', label: 'Created At', value: new Date(entity.createdAt).toLocaleString() },
    { key: 'updatedAt', label: 'Updated At', value: entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : '-' },
  ];

  if (entityType === 'Tenant') {
    fields.push(
      { key: 'name', label: 'Name', value: entity.name },
      { key: 'primaryDomain', label: 'Primary Domain', value: entity.primaryDomain },
      { key: 'extraDomains', label: 'Extra Domains', value: entity.extraDomains?.join(', ') || '-' },
      { key: 'status', label: 'Status', value: <Badge variant="outline">{entity.status}</Badge> },
      { key: 'configuration', label: 'Configuration', value: JSON.stringify(entity.configuration, null, 2) },
    );
  } else if (entityType === 'User') {
    fields.push(
      { key: 'name', label: 'Name', value: entity.name },
      { key: 'email', label: 'Email', value: entity.email },
      { key: 'role', label: 'Role', value: <Badge variant="secondary">{entity.role}</Badge> },
      { key: 'status', label: 'Status', value: <Badge variant="outline">{entity.status}</Badge> },
      { key: 'tenant', label: 'Tenant', value: entity.tenant?.name || '-' },
      { key: 'workspaces', label: 'Workspaces', value: entity.workspaces?.length || 0 },
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>
        <Separator />
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-6 space-y-6">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">{field.label}</div>
                <div className="text-sm font-mono bg-muted/30 p-2 rounded">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              // Open edit modal
              onClose();
            }}
          >
            Edit
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

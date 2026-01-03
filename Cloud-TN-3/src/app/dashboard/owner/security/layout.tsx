'use client';

import { ReactNode } from 'react';
import { Shield, Lock, Activity, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function SecurityLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Security Console</h1>
      </div>

      {/* Info Card */}
      <div className="rounded-md border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Manage RBAC policies, audit trails, data access logs, sessions, devices, and abuse detection.
        </p>
      </div>

      {/* Navigation Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/dashboard/owner/security/rbac"
          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors flex items-start gap-3"
        >
          <Lock className="h-6 w-6 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">RBAC</h3>
            <p className="text-sm text-muted-foreground">Manage roles and permissions</p>
          </div>
        </Link>
        <Link
          href="/dashboard/owner/security/sessions"
          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors flex items-start gap-3"
        >
          <Activity className="h-6 w-6 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">Sessions</h3>
            <p className="text-sm text-muted-foreground">Active user sessions</p>
          </div>
        </Link>
        <Link
          href="/dashboard/owner/security/devices"
          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors flex items-start gap-3"
        >
          <Fingerprint className="h-6 w-6 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">Devices</h3>
            <p className="text-sm text-muted-foreground">Trusted and untrusted devices</p>
          </div>
        </Link>
        <Link
          href="/dashboard/owner/security/audit-logs"
          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors flex items-start gap-3"
        >
          <Shield className="h-6 w-6 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">Audit Logs</h3>
            <p className="text-sm text-muted-foreground">System event logs</p>
          </div>
        </Link>
        <Link
          href="/dashboard/owner/security/access-logs"
          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors flex items-start gap-3"
        >
          <Activity className="h-6 w-6 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">Access Logs</h3>
            <p className="text-sm text-muted-foreground">Data access logs</p>
          </div>
        </Link>
        <Link
          href="/dashboard/owner/security/bans-rate-limits"
          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors flex items-start gap-3"
        >
          <Shield className="h-6 w-6 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">Bans & Rate Limits</h3>
            <p className="text-sm text-muted-foreground">Manage temporary bans and abuse counters</p>
          </div>
        </Link>
      </div>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}

'use client';

type ModalProps = { open: boolean; onOpenChange: (open: boolean) => void };

function ModalShell({ open, title }: { open: boolean; title: string }) {
  if (!open) return null;
  return <div className="p-4 text-sm text-muted-foreground">{title}</div>;
}

export function ConfirmDeleteModal({ open }: ModalProps & { tenantId: number }) {
  return <ModalShell open={open} title="Confirm Delete" />;
}

export function ConfirmRestoreModal({ open }: ModalProps & { tenantId: number }) {
  return <ModalShell open={open} title="Confirm Restore" />;
}

export function StatusChangeModal({ open }: ModalProps & { userId: number }) {
  return <ModalShell open={open} title="Status Change" />;
}

export function RoleAssignModal({ open }: ModalProps & { userId: number }) {
  return <ModalShell open={open} title="Role Assignment" />;
}

export function PluginUploadModal({ open }: ModalProps) {
  return <ModalShell open={open} title="Plugin Upload" />;
}

export function WorkflowDeployModal({ open }: ModalProps & { workflowId?: number }) {
  return <ModalShell open={open} title="Workflow Deploy" />;
}

export function FeatureFlagRolloutModal({ open }: ModalProps) {
  return <ModalShell open={open} title="Feature Flag Rollout" />;
}

export function ExperimentAllocationModal({ open }: ModalProps & { experimentId?: number }) {
  return <ModalShell open={open} title="Experiment Allocation" />;
}

export function ProductPricingModal({ open }: ModalProps & { productId?: number }) {
  return <ModalShell open={open} title="Product Pricing" />;
}

export function WebhookRetryModal({ open }: ModalProps & { webhookId?: number }) {
  return <ModalShell open={open} title="Webhook Retry" />;
}

export function LogDetailModal({ open }: ModalProps & { log?: { action: string; message: string; createdAt: string } }) {
  return <ModalShell open={open} title="Log Detail" />;
}

export function AnalyticsDrillModal({ open }: ModalProps & { event?: { eventType: string; createdAt: string } }) {
  return <ModalShell open={open} title="Analytics Drill" />;
}

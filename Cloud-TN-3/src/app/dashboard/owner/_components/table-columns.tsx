import { Column } from "./data-table";

export const tenantColumns: Column<any>[] = [
  { id: "slug", label: "Slug", accessor: (r) => r.slug, sortable: true },
  { id: "displayName", label: "Name", accessor: (r) => r.displayName, sortable: true },
  { id: "legalName", label: "Legal Name", accessor: (r) => r.legalName },
  { id: "plan", label: "Plan", accessor: (r) => r.plan, sortable: true },
  { id: "primaryDomain", label: "Domain", accessor: (r) => r.primaryDomain },
];

export const workspaceColumns: Column<any>[] = [
  { id: "name", label: "Name", accessor: (r) => r.name, sortable: true },
  { id: "slug", label: "Slug", accessor: (r) => r.slug },
  { id: "tenantId", label: "Tenant", accessor: (r) => r.tenantId, sortable: true },
  { id: "plan", label: "Plan", accessor: (r) => r.plan },
];

export const userColumns: Column<any>[] = [
  { id: "email", label: "Email", accessor: (r) => r.email, sortable: true },
  { id: "role", label: "Role", accessor: (r) => r.role, sortable: true },
  { id: "status", label: "Status", accessor: (r) => r.status },
];

export const articleColumns: Column<any>[] = [
  { id: "title", label: "Title", accessor: (r) => r.title, sortable: true },
  { id: "slug", label: "Slug", accessor: (r) => r.slug },
  { id: "status", label: "Status", accessor: (r) => r.status },
  { id: "aiScore", label: "AI Score", accessor: (r) => r.aiScore },
];

export const pluginColumns: Column<any>[] = [
  { id: "name", label: "Name", accessor: (r) => r.name, sortable: true },
  { id: "slug", label: "Slug", accessor: (r) => r.slug },
  { id: "version", label: "Version", accessor: (r) => r.version },
  { id: "status", label: "Status", accessor: (r) => r.status ?? "available" },
  { id: "visibility", label: "Visibility", accessor: (r) => r.visibility ?? "private" },
];

export const aiModelColumns: Column<any>[] = [
  { id: "name", label: "Name", accessor: (r) => r.name, sortable: true },
  { id: "provider", label: "Provider", accessor: (r) => r.provider },
  { id: "model", label: "Model", accessor: (r) => r.model },
];

export const aiAgentColumns: Column<any>[] = [
  { id: "name", label: "Name", accessor: (r) => r.name, sortable: true },
  { id: "kind", label: "Kind", accessor: (r) => r.kind },
  { id: "modelConfigId", label: "Model", accessor: (r) => r.modelConfigId },
  { id: "enabled", label: "Enabled", accessor: (r) => (r.enabled ? "Yes" : "No") },
];

export const workflowColumns: Column<any>[] = [
  { id: "key", label: "Key", accessor: (r) => r.key, sortable: true },
  { id: "name", label: "Name", accessor: (r) => r.name },
  { id: "isActive", label: "Active", accessor: (r) => (r.isActive ? "Active" : "Inactive") },
];

export const featureFlagColumns: Column<any>[] = [
  { id: "key", label: "Key", accessor: (r) => r.key, sortable: true },
  { id: "defaultVariant", label: "Default", accessor: (r) => r.defaultVariant },
  { id: "isActive", label: "Active", accessor: (r) => (r.isActive ? "Active" : "Inactive") },
];

export const experimentColumns: Column<any>[] = [
  { id: "key", label: "Key", accessor: (r) => r.key, sortable: true },
  { id: "name", label: "Name", accessor: (r) => r.name },
  { id: "status", label: "Status", accessor: (r) => r.status },
];

export const productColumns: Column<any>[] = [
  { id: "name", label: "Name", accessor: (r) => r.name, sortable: true },
  { id: "price", label: "Price", accessor: (r) => r.price, sortable: true },
  { id: "currency", label: "Currency", accessor: (r) => r.currency },
  { id: "status", label: "Status", accessor: (r) => r.status ?? "active" },
];

export const subscriptionColumns: Column<any>[] = [
  { id: "userId", label: "User", accessor: (r) => r.userId, sortable: true },
  { id: "productId", label: "Product", accessor: (r) => r.productId, sortable: true },
  { id: "status", label: "Status", accessor: (r) => r.status },
  { id: "currentPeriodEnd", label: "Period End", accessor: (r) => new Date(r.currentPeriodEnd ?? Date.now()).toLocaleString() },
];

export const orderColumns: Column<any>[] = [
  { id: "userId", label: "User", accessor: (r) => r.userId, sortable: true },
  { id: "productId", label: "Product", accessor: (r) => r.productId, sortable: true },
  { id: "amount", label: "Amount", accessor: (r) => r.amount, sortable: true },
  { id: "status", label: "Status", accessor: (r) => r.status },
  { id: "createdAt", label: "Created", accessor: (r) => new Date(r.createdAt ?? Date.now()).toLocaleString() },
];

export const entitlementColumns: Column<any>[] = [
  { id: "userId", label: "User", accessor: (r) => r.userId },
  { id: "entitlementType", label: "Type", accessor: (r) => r.entitlementType },
  { id: "productId", label: "Product", accessor: (r) => r.productId },
  { id: "subjectId", label: "Subject", accessor: (r) => r.subjectId },
  { id: "createdAt", label: "Granted", accessor: (r) => new Date(r.createdAt).toLocaleString() },
];

export const usageColumns: Column<any>[] = [
  { id: "userId", label: "User", accessor: (r) => r.userId },
  { id: "event", label: "Event", accessor: (r) => r.event ?? r.usageType ?? "usage" },
  { id: "amount", label: "Amount", accessor: (r) => r.amount ?? r.units ?? 0 },
  { id: "productId", label: "Product", accessor: (r) => r.productId ?? "-" },
  { id: "createdAt", label: "Time", accessor: (r) => new Date(r.createdAt ?? r.timestamp ?? Date.now()).toLocaleString() },
];

export const webhookColumns: Column<any>[] = [
  { id: "url", label: "URL", accessor: (r) => r.url },
  { id: "status", label: "Status", accessor: (r) => r.status ?? "active" },
  { id: "events", label: "Events", accessor: (r) => (r.events || []).join(", ") },
  { id: "createdAt", label: "Created", accessor: (r) => new Date(r.createdAt ?? Date.now()).toLocaleString() },
];

export const analyticsColumns: Column<any>[] = [
  { id: "eventType", label: "Event", accessor: (r) => r.eventType },
  { id: "createdAt", label: "Time", accessor: (r) => new Date(r.createdAt).toLocaleString() },
];

export const logColumns: Column<any>[] = [
  { id: "type", label: "Type", accessor: (r) => r.type ?? "audit", sortable: true },
  { id: "userId", label: "User", accessor: (r) => r.userId ?? "" },
  { id: "action", label: "Action", accessor: (r) => r.action ?? r.resource ?? "-" },
  { id: "message", label: "Message", accessor: (r) => r.message ?? r.payload ?? "" },
  { id: "createdAt", label: "Time", accessor: (r) => new Date(r.createdAt).toLocaleString() },
];

export const settingsColumns: Column<any>[] = [
  { id: "key", label: "Key", accessor: (r) => r.key, sortable: true },
  { id: "value", label: "Value", accessor: (r) => String(r.value ?? "") },
  { id: "category", label: "Category", accessor: (r) => r.category ?? "general" },
  { id: "updatedAt", label: "Updated", accessor: (r) => new Date(r.updatedAt ?? Date.now()).toLocaleString() },
];

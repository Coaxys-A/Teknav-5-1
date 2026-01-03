export type OwnerNavItem = {
  href: string;
  label: string;
};

export const ownerNav: OwnerNavItem[] = [
  { href: "/dashboard/owner", label: "Overview" },
  { href: "/dashboard/owner/tenants", label: "Tenants" },
  { href: "/dashboard/owner/workspaces", label: "Workspaces" },
  { href: "/dashboard/owner/users", label: "Users" },
  { href: "/dashboard/owner/articles", label: "Articles" },
  { href: "/dashboard/owner/plugins", label: "Plugins" },
  { href: "/dashboard/owner/ai", label: "AI" },
  { href: "/dashboard/owner/feature-flags", label: "Feature Flags" },
  { href: "/dashboard/owner/experiments", label: "Experiments" },
  { href: "/dashboard/owner/workflows", label: "Workflows" },
  { href: "/dashboard/owner/store", label: "Store" },
  { href: "/dashboard/owner/webhooks", label: "Webhooks" },
  { href: "/dashboard/owner/analytics", label: "Analytics" },
  { href: "/dashboard/owner/logs", label: "Logs" },
  { href: "/dashboard/owner/settings", label: "Settings" },
];

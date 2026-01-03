export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "AUTHOR" | "WRITER" | "CREATOR" | "PUBLISHER" | "USER" | "GUEST";

export const ROLE_PRIORITY: Record<UserRole, number> = {
  OWNER: 7,
  ADMIN: 6,
  MANAGER: 5,
  EDITOR: 4,
  AUTHOR: 3,
  WRITER: 2,
  CREATOR: 2,
  PUBLISHER: 2,
  USER: 1,
  GUEST: 0,
};

export function canAccess(required: UserRole, actual: UserRole | undefined): boolean {
  if (!actual) {
    return false;
  }
  return ROLE_PRIORITY[actual] >= ROLE_PRIORITY[required];
}

export function normalizeRole(role?: string | null): UserRole {
  switch (role) {
    case "OWNER":
    case "ADMIN":
    case "MANAGER":
    case "EDITOR":
    case "AUTHOR":
    case "WRITER":
    case "CREATOR":
    case "PUBLISHER":
    case "USER":
      return role;
    default:
      return "GUEST";
  }
}

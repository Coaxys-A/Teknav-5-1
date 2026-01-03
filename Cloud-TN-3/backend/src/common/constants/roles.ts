import { Role } from '@prisma/client';

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 6,
  ADMIN: 5,
  MANAGER: 4,
  EDITOR: 3,
  AUTHOR: 2,
  WRITER: 2,
   PUBLISHER: 2,
   CREATOR: 2,
  USER: 1,
  GUEST: 0,
};

export const ADMIN_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MANAGER];
export const EDIT_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.EDITOR, Role.WRITER, Role.AUTHOR, Role.CREATOR, Role.PUBLISHER];

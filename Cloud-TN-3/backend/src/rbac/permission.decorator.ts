import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'rbac:permission';

export type PermissionDescriptor = {
  resource: string;
  action: string;
  scope?: 'tenant' | 'workspace' | 'global';
};

export const Permission = (permission: PermissionDescriptor) => SetMetadata(PERMISSION_KEY, permission);

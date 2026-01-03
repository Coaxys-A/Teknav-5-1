import { Module } from '@nestjs/common';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ArticlesModule } from './articles/articles.module';
import { WorkflowsOwnerModule } from './workflows/workflows-owner.module';
import { OwnerAnalyticsModule } from './analytics/owner-analytics.module';
import { OwnerQueuesModule } from '../queues/owner-queues.module';
import { OwnerSecurityModule } from './security/owner-security.module';
import { OwnerLogsModule } from './logs/logs.module';

/**
 * Owner Module
 *
 * Aggregates all owner-specific modules.
 */

@Module({
  imports: [
    TenantsModule,
    UsersModule,
    WorkspacesModule,
    ArticlesModule,
    WorkflowsOwnerModule,
    OwnerAnalyticsModule,
    OwnerQueuesModule,
    OwnerSecurityModule,
    OwnerLogsModule,
  ],
  exports: [
    TenantsModule,
    UsersModule,
    WorkspacesModule,
    ArticlesModule,
    WorkflowsOwnerModule,
    OwnerAnalyticsModule,
    OwnerQueuesModule,
    OwnerSecurityModule,
    OwnerLogsModule,
  ],
})
export class OwnerModule {}

import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EntitlementService } from './entitlement.service';
import { BillingService } from './billing.service';
import { StoreController } from './store.controller';
import { ProductsController } from './products.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { OrdersController } from './orders.controller';
import { EntitlementsController } from './entitlements.controller';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';
import { BillingWebhookController } from './webhook.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    StoreController,
    ProductsController,
    SubscriptionsController,
    OrdersController,
    EntitlementsController,
    UsageController,
    BillingWebhookController,
  ],
  providers: [StoreService, EntitlementService, BillingService, UsageService],
  exports: [EntitlementService, BillingService, UsageService],
})
export class StoreModule {}

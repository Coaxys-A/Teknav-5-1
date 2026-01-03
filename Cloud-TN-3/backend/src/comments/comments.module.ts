import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { AuditModule } from '../audit/audit.module';
import { TrustSafetyModule } from '../trust-safety/trust-safety.module';

@Module({
  imports: [PrismaModule, AuditModule, TrustSafetyModule],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SponsorsService } from './sponsors.service';
import { SponsorsController } from './sponsors.controller';

@Module({
  imports: [PrismaModule],
  providers: [SponsorsService],
  controllers: [SponsorsController],
  exports: [SponsorsService],
})
export class SponsorsModule {}

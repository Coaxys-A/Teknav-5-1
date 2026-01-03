import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocialController],
})
export class SocialModule {}

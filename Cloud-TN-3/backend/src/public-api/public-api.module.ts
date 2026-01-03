import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { SeoModule } from '../seo/seo.module';

@Module({
  imports: [PrismaModule, ApiKeysModule, RecommendationModule, SeoModule],
  controllers: [PublicApiController],
})
export class PublicApiModule {}

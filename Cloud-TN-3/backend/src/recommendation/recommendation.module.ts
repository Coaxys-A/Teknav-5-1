import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { PersonalizedController } from './personalized.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserEventsModule } from '../user-events/user-events.module';

@Module({
  imports: [PrismaModule, UserEventsModule],
  providers: [RecommendationService],
  controllers: [RecommendationController, PersonalizedController],
  exports: [RecommendationService],
})
export class RecommendationModule {}

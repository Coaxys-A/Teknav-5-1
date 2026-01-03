import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiPersonalizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(userId: number) {
    return this.prisma.aiUserProfile.findUnique({ where: { userId } });
  }
}

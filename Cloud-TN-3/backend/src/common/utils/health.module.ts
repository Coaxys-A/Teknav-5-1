import { Controller, Get, Module } from '@nestjs/common';

@Controller('health')
class HealthController {
  @Get()
  health() {
    return { ok: true, service: 'teknav-backend' };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}

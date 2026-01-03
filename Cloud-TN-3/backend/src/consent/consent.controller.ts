import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('consent')
@UseGuards(JwtAuthGuard)
export class ConsentController {
  constructor(private readonly consent: ConsentService) {}

  @Get()
  async list(@CurrentUser() user: any) {
    return this.consent.getConsents(user.id);
  }

  @Post()
  async update(@CurrentUser() user: any, @Body() body: { consents: { type: string; status: string }[] }) {
    return this.consent.setConsents(user.id, body.consents ?? []);
  }
}

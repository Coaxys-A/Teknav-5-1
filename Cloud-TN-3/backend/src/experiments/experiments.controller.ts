import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ExperimentsService } from './experiments.service';

@Controller('owner/experiments')
export class ExperimentsController {
  constructor(private readonly experiments: ExperimentsService) {}

  @Get()
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.experiments.list(Number(page ?? 1), Number(pageSize ?? 20));
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.experiments.detail(Number(id));
  }

  @Post()
  create(@Body() body: any) {
    return this.experiments.create(body);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.experiments.update(Number(id), body);
  }

  @Post(':id/exposure')
  exposure(@Param('id') id: string, @Body() body: any) {
    return this.experiments.recordExposure(Number(id), body.variantKey, body.userId);
  }

  @Post(':id/conversion')
  conversion(@Param('id') id: string, @Body() body: any) {
    return this.experiments.recordConversion(Number(id), body.variantKey, body.metric ?? 'default', Number(body.value ?? 1), body.userId);
  }
}

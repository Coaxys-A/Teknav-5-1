import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AdsService } from './ads.service';
import { ServeAdDto } from './dto/serve-ad.dto';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('serve')
  async serve(@Query() query: ServeAdDto) {
    const tags = query.tags ? query.tags.split(',').map((t) => t.trim()) : [];
    const creative = await this.adsService.serve(query.slotKey, {
      device: query.device,
      lang: query.lang,
      tags,
    });
    return { creative };
  }

  @Post('serve')
  async servePost(@Body() body: ServeAdDto) {
    const tags = body.tags ? body.tags.split(',').map((t) => t.trim()) : [];
    const creative = await this.adsService.serve(body.slotKey, {
      device: body.device,
      lang: body.lang,
      tags,
    });
    return { creative };
  }
}

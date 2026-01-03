import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WordpressService } from './wordpress.service';

@Module({
  imports: [ConfigModule],
  providers: [WordpressService],
  exports: [WordpressService],
})
export class WordpressModule {}

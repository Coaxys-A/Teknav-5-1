import { Module } from '@nestjs/common';
import { MobileController } from './mobile.controller';
import { ArticlesModule } from '../articles/articles.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [ArticlesModule, SearchModule],
  controllers: [MobileController],
})
export class MobileModule {}

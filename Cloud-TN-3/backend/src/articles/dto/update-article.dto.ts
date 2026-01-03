import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength, IsInt, Min } from 'class-validator';
import { CreateArticleDto } from './create-article.dto';

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'PENDING', 'PROPOSED', 'PUBLISH', 'REJECTED', 'SCHEDULED'])
  status?: string;

  @IsOptional()
  @IsNumber()
  aiScore?: number;

  @IsOptional()
  @IsString()
  aiDecision?: string;

  @IsOptional()
  @IsBoolean()
  autoPublished?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt({ each: true })
  tagIds?: number[];

  @IsOptional()
  @IsInt()
  coverImageId?: number;
}

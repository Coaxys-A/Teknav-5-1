import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength, Min } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @MinLength(6)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  excerpt?: string;

  @IsString()
  @MinLength(50)
  @MaxLength(20000)
  content!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

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
  @IsString()
  @MaxLength(80)
  mainKeyword?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  readingTime?: number;

  @IsOptional()
  @IsInt({ each: true })
  tagIds?: number[];

  @IsOptional()
  @IsInt()
  coverImageId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'PROPOSED', 'PENDING', 'PUBLISH', 'REJECTED', 'SCHEDULED'])
  status?: string;
}

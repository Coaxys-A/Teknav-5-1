import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsInt()
  articleId!: number;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  guestName?: string;
}

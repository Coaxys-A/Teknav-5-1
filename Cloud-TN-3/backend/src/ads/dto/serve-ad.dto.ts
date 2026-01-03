import { IsOptional, IsString } from 'class-validator';

export class ServeAdDto {
  @IsString()
  slotKey!: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  device?: string;

  @IsOptional()
  @IsString()
  lang?: string;

  @IsOptional()
  @IsString()
  tags?: string;
}

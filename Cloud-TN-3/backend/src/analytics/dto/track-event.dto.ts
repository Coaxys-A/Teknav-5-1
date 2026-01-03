import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackEventDto {
  @IsString()
  @MaxLength(100)
  eventType!: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

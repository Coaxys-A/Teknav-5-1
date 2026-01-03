import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  sessionId!: string;

  @IsString()
  @MinLength(20)
  refreshToken!: string;
}

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ValidateContentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  content!: string;
}

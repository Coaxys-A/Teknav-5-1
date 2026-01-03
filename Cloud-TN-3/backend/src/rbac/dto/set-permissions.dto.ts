import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class SetPermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  resources: string[];

  @IsArray()
  @ArrayNotEmpty()
  actions: string[];
}

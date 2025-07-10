import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsArray()
  @IsOptional()
  content?: any[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsUUID()
  @IsOptional()
  tradeId?: string;

  @IsEnum(['private', 'shared'])
  @IsOptional()
  visibility?: 'private' | 'shared';

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}

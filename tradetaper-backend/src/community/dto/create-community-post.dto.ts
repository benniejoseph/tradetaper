import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsArray,
} from 'class-validator';
import {
  COMMUNITY_POST_TYPES,
  COMMUNITY_VISIBILITIES,
} from '../community.constants';

export class CreateCommunityPostDto {
  @IsIn(COMMUNITY_POST_TYPES)
  type: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  symbol?: string;

  @IsOptional()
  @IsUUID()
  strategyId?: string;

  @IsOptional()
  @IsUUID()
  tradeId?: string;

  @IsOptional()
  @IsString()
  assetType?: string;

  @IsOptional()
  @IsString()
  timeframe?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  imageUrl?: string;

  @IsOptional()
  @IsIn(COMMUNITY_VISIBILITIES)
  visibility?: string;
}

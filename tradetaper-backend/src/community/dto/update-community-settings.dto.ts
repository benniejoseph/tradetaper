import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import {
  COMMUNITY_VISIBILITIES,
  COMMUNITY_DM_VISIBILITIES,
} from '../community.constants';

export class UpdateCommunitySettingsDto {
  @IsOptional()
  @IsBoolean()
  publicProfile?: boolean;

  @IsOptional()
  @IsBoolean()
  rankingOptIn?: boolean;

  @IsOptional()
  @IsBoolean()
  showMetrics?: boolean;

  @IsOptional()
  @IsBoolean()
  showAccountSizeBand?: boolean;

  @IsOptional()
  @IsIn(COMMUNITY_VISIBILITIES)
  postVisibility?: string;

  @IsOptional()
  @IsIn(COMMUNITY_DM_VISIBILITIES)
  dmVisibility?: string;
}

import {
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const HH_MM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  channelPreferences?: Record<string, { inApp?: boolean; push?: boolean; email?: boolean }>;

  @IsOptional()
  @IsBoolean()
  economicAlert1h?: boolean;

  @IsOptional()
  @IsBoolean()
  economicAlert15m?: boolean;

  @IsOptional()
  @IsBoolean()
  economicAlertNow?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['high', 'medium', 'low'], { each: true })
  economicEventImportance?: Array<'high' | 'medium' | 'low'>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(12, { each: true })
  economicEventCurrencies?: string[];

  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @IsOptional()
  @IsString()
  @Matches(HH_MM_PATTERN)
  quietHoursStart?: string;

  @IsOptional()
  @IsString()
  @Matches(HH_MM_PATTERN)
  quietHoursEnd?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  dailyDigestEnabled?: boolean;

  @IsOptional()
  @IsString()
  @Matches(HH_MM_PATTERN)
  dailyDigestTime?: string;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;
}

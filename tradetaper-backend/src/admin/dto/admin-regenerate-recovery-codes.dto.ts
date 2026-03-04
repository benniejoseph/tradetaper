import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class AdminRegenerateRecoveryCodesDto {
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'otpCode must be a 6-digit numeric code' })
  otpCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  recoveryCode?: string;
}

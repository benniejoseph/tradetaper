import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class AdminMfaBootstrapCompleteDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1024)
  bootstrapToken: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'otpCode must be a 6-digit numeric code' })
  otpCode: string;
}

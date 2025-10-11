import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreatePaymentLinkDto {
  @IsString()
  @IsOptional()
  @IsIn([
    'starter',
    'professional',
    'enterprise',
    'starter_yearly',
    'professional_yearly',
    'enterprise_yearly',
  ])
  plan?: string = 'starter';

  // Legacy support for price-based requests
  @IsString()
  @IsOptional()
  priceId?: string;
}

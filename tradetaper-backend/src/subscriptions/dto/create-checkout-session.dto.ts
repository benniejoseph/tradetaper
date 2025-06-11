import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @IsUrl()
  @IsNotEmpty()
  successUrl: string;

  @IsUrl()
  @IsNotEmpty()
  cancelUrl: string;
}

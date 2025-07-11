import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreatePortalSessionDto {
  @IsUrl()
  @IsNotEmpty()
  return_url: string;
}

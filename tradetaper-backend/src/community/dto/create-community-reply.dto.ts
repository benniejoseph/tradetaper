import { IsString, MaxLength } from 'class-validator';

export class CreateCommunityReplyDto {
  @IsString()
  @MaxLength(5000)
  content: string;
}

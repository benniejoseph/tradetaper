import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
    message:
      'Username must start with a letter and contain only letters, numbers, or underscores.',
  })
  username: string;
}

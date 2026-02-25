import { IsArray, IsUUID } from 'class-validator';

export class GroupTradesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  tradeIds: string[];
}

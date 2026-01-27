import { PartialType } from '@nestjs/mapped-types';
import { CreateMarketLogDto } from './create-market-log.dto';

export class UpdateMarketLogDto extends PartialType(CreateMarketLogDto) {}

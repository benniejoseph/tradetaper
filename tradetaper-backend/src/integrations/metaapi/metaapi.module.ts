// src/integrations/metaapi/metaapi.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetaApiService } from './metaapi.service';
import { TradeMapperService } from './trade-mapper.service';

@Module({
  imports: [ConfigModule],
  providers: [MetaApiService, TradeMapperService],
  exports: [MetaApiService, TradeMapperService],
})
export class MetaApiModule {}

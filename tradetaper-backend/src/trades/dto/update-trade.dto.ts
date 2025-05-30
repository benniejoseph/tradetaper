// src/trades/dto/update-trade.dto.ts
import { PartialType } from '@nestjs/mapped-types'; // Or @nestjs/swagger if using Swagger
import { CreateTradeDto } from './create-trade.dto';
// All fields from CreateTradeDto become optional

export class UpdateTradeDto extends PartialType(CreateTradeDto) {}
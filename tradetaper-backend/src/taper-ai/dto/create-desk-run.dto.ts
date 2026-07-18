// src/taper-ai/dto/create-desk-run.dto.ts
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateDeskRunDto {
  /** Ticker / instrument symbol, e.g. AAPL, BTCUSD, EURUSD */
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9._\-\/]+$/, {
    message: 'symbol contains invalid characters',
  })
  symbol: string;

  /** Persona agents to include; defaults to all available */
  @IsOptional()
  @IsArray()
  @IsIn(['buffett', 'burry', 'wood'], { each: true })
  personas?: string[];
}

import { IsString, IsNumber, IsArray, IsOptional, IsEnum, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChecklistResponseDto {
  @IsString()
  itemId: string;

  @IsString()
  text: string;

  @IsOptional()
  checked: boolean;
}

export class CreateApprovalDto {
  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  strategyId?: string;

  @IsString()
  symbol: string;

  @IsString()
  @IsEnum(['Long', 'Short'])
  direction: 'Long' | 'Short';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistResponseDto)
  checklistResponses: ChecklistResponseDto[];

  @IsNumber()
  @Min(0.1)
  @Max(5.0)
  riskPercent: number;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  calculatedLotSize?: number;

  @IsNumber()
  @IsOptional()
  stopLoss?: number;

  @IsNumber()
  @IsOptional()
  takeProfit?: number;
}

export class ApproveTradeDto {
  @IsNumber()
  @Min(0.01)
  calculatedLotSize: number;

  @IsNumber()
  stopLoss: number;

  @IsNumber()
  @IsOptional()
  takeProfit?: number;
}

export class CompleteExerciseDto {
  @IsString()
  exerciseId: string;
}

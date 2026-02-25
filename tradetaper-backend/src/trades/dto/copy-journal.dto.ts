import { IsEnum, IsNotEmpty } from 'class-validator';

export enum CopyJournalMode {
  OVERRIDE = 'OVERRIDE',
  PARTIAL = 'PARTIAL',
}

export class CopyJournalDto {
  @IsEnum(CopyJournalMode)
  @IsNotEmpty()
  mode: CopyJournalMode;
}

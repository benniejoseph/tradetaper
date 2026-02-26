import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export interface CotDataPoint {
  date: Date;
  netNonCommercial: number;
  netNonReportable: number;
  openInterest: number;
  longNonCommercial: number;
  shortNonCommercial: number;
  longNonReportable: number;
  shortNonReportable: number;
}

@Entity('cot_weekly_reports')
@Index(['symbol', 'reportDate'], { unique: true })
export class CotWeeklyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128 })
  symbol: string; // e.g., 'EUR', 'GBP', 'GOLD', 'WTI'

  @Column({ type: 'varchar', length: 128 })
  cftcContractName: string; // e.g., 'EURO FX - CHICAGO MERCANTILE EXCHANGE'

  @Column({ type: 'timestamptz' })
  reportDate: Date; // The Tuesday Date it measures

  @Column({ type: 'jsonb' })
  data: CotDataPoint;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

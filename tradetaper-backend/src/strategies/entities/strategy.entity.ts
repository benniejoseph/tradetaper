import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
// Forward references to avoid circular imports
import { TradingSession } from '../../types/enums';

export interface ChecklistItem {
  id: string;
  text: string;
  completed?: boolean;
  order: number;
}

@Entity('strategies')
@Index(['userId']) // PERFORMANCE: Index for user queries
@Index(['isActive']) // PERFORMANCE: Index for active strategy filtering
@Index(['userId', 'isActive']) // PERFORMANCE: Composite index for common query pattern
export class Strategy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  checklist: ChecklistItem[];

  @Column({
    type: 'enum',
    enum: TradingSession,
    nullable: true,
  })
  tradingSession: TradingSession;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  maxRiskPercent: number; // Maximum risk per trade for this strategy (1.0 = 1%)

  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  color: string; // Hex color for UI display

  @Column({ type: 'text', nullable: true })
  tags: string; // Comma-separated tags

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations - simplified without complex relationships
  @Column()
  userId: string;

  // trades relationship temporarily commented out
  // @OneToMany('Trade', 'strategy')
  // trades: any[];
}

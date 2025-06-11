import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
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

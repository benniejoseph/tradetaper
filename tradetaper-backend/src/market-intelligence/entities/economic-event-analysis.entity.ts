import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('economic_event_analyses')
@Index(['eventId'], { unique: true })
@Index(['eventKey'])
@Index(['eventDate'])
export class EconomicEventAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128 })
  eventId: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  eventKey?: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  currency?: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  importance?: string;

  @Column({ type: 'timestamptz', nullable: true })
  eventDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  analysis?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  aiSummary?: Record<string, any>;

  @Column({ type: 'numeric', nullable: true })
  confidence?: number;

  @Column({ type: 'jsonb', nullable: true })
  sourceQuality?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

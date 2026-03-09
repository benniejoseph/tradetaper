import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('economic_event_releases')
@Index(['eventId'])
@Index(['eventKey', 'eventDate'], { unique: true })
@Index(['currency'])
@Index(['eventDate'])
export class EconomicEventRelease {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  eventId: string;

  @Column({ type: 'varchar', length: 180 })
  eventKey: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  currency?: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  importance?: string;

  @Column({ type: 'timestamptz' })
  eventDate: Date;

  @Column({ type: 'varchar', length: 32, default: 'upcoming' })
  releaseStatus: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  actual?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  forecast?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  previous?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  revised?: string;

  @Column({ type: 'numeric', nullable: true })
  actualNumeric?: number;

  @Column({ type: 'numeric', nullable: true })
  forecastNumeric?: number;

  @Column({ type: 'numeric', nullable: true })
  previousNumeric?: number;

  @Column({ type: 'numeric', nullable: true })
  surpriseNumeric?: number;

  @Column({ type: 'numeric', nullable: true })
  surprisePercent?: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  source?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

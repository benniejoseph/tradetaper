import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('economic_event_alerts')
@Index(['userId', 'eventId'], { unique: true })
@Index(['eventId'])
export class EconomicEventAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 128 })
  eventId: string;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum CooldownTrigger {
  LOSS_STREAK = 'loss_streak',
  OVERTRADING = 'overtrading',
  REVENGE_TRADE = 'revenge_trade',
  UNAUTHORIZED_TRADE = 'unauthorized_trade',
  OUTSIDE_HOURS = 'outside_hours',
  MANUAL = 'manual',
}

export interface CompletedExercise {
  exerciseId: string;
  name: string;
  completedAt: Date;
}

@Entity('cooldown_sessions')
export class CooldownSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: CooldownTrigger,
  })
  triggerReason: CooldownTrigger;

  @Column({ default: 15 })
  durationMinutes: number;

  @Column({ type: 'jsonb', default: [] })
  exercisesCompleted: CompletedExercise[];

  @Column({ type: 'jsonb', default: [] })
  requiredExercises: string[]; // Exercise IDs that must be completed

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ default: false })
  isSkipped: boolean; // If user bypasses (with penalty)

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;
}

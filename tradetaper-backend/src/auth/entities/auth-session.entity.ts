import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('auth_sessions')
@Index('IDX_auth_sessions_userId', ['userId'])
@Index('IDX_auth_sessions_expiresAt', ['expiresAt'])
@Index('IDX_auth_sessions_revokedAt', ['revokedAt'])
export class AuthSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 128 })
  tokenHash: string;

  @Column({ type: 'uuid' })
  @Index('IDX_auth_sessions_familyId')
  familyId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index('IDX_auth_sessions_parentSessionId')
  parentSessionId?: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt?: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  revokedReason?: string | null;

  @Column({ type: 'uuid', nullable: true })
  replacedBySessionId?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt?: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipAddress?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

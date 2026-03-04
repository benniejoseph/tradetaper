import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AdminAuthAuditOutcome = 'success' | 'failure';

@Entity('admin_auth_audit_logs')
@Index('IDX_admin_auth_audit_logs_createdAt', ['createdAt'])
@Index('IDX_admin_auth_audit_logs_eventType', ['eventType'])
@Index('IDX_admin_auth_audit_logs_outcome', ['outcome'])
@Index('IDX_admin_auth_audit_logs_adminEmail', ['adminEmail'])
export class AdminAuthAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  eventType: string;

  @Column({ type: 'varchar', length: 16 })
  outcome: AdminAuthAuditOutcome;

  @Column({ type: 'varchar', length: 255, nullable: true })
  adminEmail?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipAddress?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  reason?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  requestId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}

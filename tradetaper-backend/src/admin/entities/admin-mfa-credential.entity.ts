import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('admin_mfa_credentials')
@Index('UQ_admin_mfa_credentials_adminEmail', ['adminEmail'], { unique: true })
export class AdminMfaCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  adminEmail: string;

  @Column({ type: 'text' })
  totpSecretEncrypted: string;

  @Column({ type: 'varchar', length: 64 })
  totpSecretIv: string;

  @Column({ type: 'varchar', length: 64 })
  totpSecretAuthTag: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  recoveryCodeHashes: string[];

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  enrolledAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  recoveryCodesGeneratedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastVerifiedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastRecoveryCodeUsedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// src/statement-parser/entities/statement-upload.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MT5Account } from '../../users/entities/mt5-account.entity';

export enum StatementFileType {
  MT4_HTML = 'MT4_HTML',
  MT5_CSV = 'MT5_CSV',
  MT5_HTML = 'MT5_HTML',
  UNKNOWN = 'UNKNOWN',
}

export enum UploadStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('statement_uploads')
export class StatementUpload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({
    type: 'enum',
    enum: StatementFileType,
    default: StatementFileType.UNKNOWN,
  })
  fileType: StatementFileType;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ length: 500, nullable: true })
  storagePath: string;

  @Column({
    type: 'enum',
    enum: UploadStatus,
    default: UploadStatus.PENDING,
  })
  status: UploadStatus;

  @Column({ type: 'int', default: 0 })
  tradesImported: number;

  @Column({ type: 'int', default: 0 })
  tradesSkipped: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => MT5Account, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'accountId' })
  account: MT5Account;

  @Column({ nullable: true })
  accountId: string;
}

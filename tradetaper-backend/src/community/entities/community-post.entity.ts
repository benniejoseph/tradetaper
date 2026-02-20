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

@Entity('community_posts')
@Index(['userId', 'createdAt'])
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 32 })
  type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  symbol?: string;

  @Column({ type: 'uuid', nullable: true })
  strategyId?: string;

  @Column({ type: 'uuid', nullable: true })
  tradeId?: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  assetType?: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  timeframe?: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  imageUrl?: string;

  @Column({ type: 'varchar', length: 24, default: 'public' })
  visibility: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

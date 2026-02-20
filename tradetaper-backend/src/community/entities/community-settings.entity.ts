import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('community_settings')
export class CommunitySettings {
  @PrimaryColumn('uuid')
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'boolean', default: false })
  publicProfile: boolean;

  @Column({ type: 'boolean', default: true })
  rankingOptIn: boolean;

  @Column({ type: 'boolean', default: true })
  showMetrics: boolean;

  @Column({ type: 'boolean', default: true })
  showAccountSizeBand: boolean;

  @Column({ type: 'varchar', length: 24, default: 'public' })
  postVisibility: string;

  @Column({ type: 'varchar', length: 24, default: 'followers' })
  dmVisibility: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// src/tags/entities/tag.entity.ts
import { User } from '../../users/entities/user.entity';
import { Trade } from '../../trades/entities/trade.entity';
import { Type, Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  Index,
  JoinColumn,
} from 'typeorm';

@Entity('tags')
@Index(['userId', 'name'], { unique: true }) // Each user has unique tag names
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // Tag belongs to a user
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ length: 7, default: '#cccccc' }) // Default color, e.g., light gray
  color?: string; // Optional: users might assign colors to tags

  @Type(() => Trade)
  @Exclude({ toPlainOnly: true })
  @ManyToMany(() => Trade, (trade) => trade.tags)
  // JoinTable is usually defined on one side of M2M. We'll put it on Trade entity.
  trades: Trade[]; // Trades associated with this tag

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

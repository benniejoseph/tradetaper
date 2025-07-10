// src/users/entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { PsychologicalInsight } from '../../notes/entities/psychological-insight.entity';
import * as bcrypt from 'bcrypt';
// Forward reference for Strategy to avoid circular imports

@Entity('users') // This will create a table named 'users'
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255, select: false, nullable: true }) // nullable for OAuth users
  password?: string;

  @Column({ length: 100, nullable: true })
  firstName?: string;

  @Column({ length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  // strategies relationship temporarily commented out
  // @OneToMany('Strategy', 'user')
  // strategies: any[];

  // We'll add other fields like subscription status, etc., later

  @OneToMany(() => PsychologicalInsight, psychologicalInsight => psychologicalInsight.user)
  psychologicalInsights: PsychologicalInsight[];

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const saltRounds = 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) {
      return false; // OAuth users don't have passwords
    }
    return bcrypt.compare(password, this.password);
  }
}

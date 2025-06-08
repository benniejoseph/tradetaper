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
import * as bcrypt from 'bcrypt';
// Forward reference for Strategy to avoid circular imports

@Entity('users') // This will create a table named 'users'
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255, select: false }) // select: false to not return password by default
  password: string;

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

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const saltRounds = 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

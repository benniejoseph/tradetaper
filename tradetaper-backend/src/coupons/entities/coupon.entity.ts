import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.PERCENTAGE,
  })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number; // Percentage value (e.g. 20 for 20%) or Flat amount (e.g. 500)

  @Column({ nullable: true })
  razorpayOfferId: string; // If linked to a Razorpay Offer

  @Column({ default: -1 })
  maxUses: number; // -1 for unlimited

  @Column({ default: 0 })
  usedCount: number;

  @Column({ type: 'timestamp', nullable: true })
  validUntil: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

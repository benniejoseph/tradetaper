import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../entities/coupon.entity';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private couponsRepository: Repository<Coupon>,
  ) {}

  async create(code: string, value: number, type: any, razorpayOfferId?: string, maxUses: number = -1, validUntil?: Date) {
      if (await this.couponsRepository.findOne({ where: { code } })) {
          throw new BadRequestException('Coupon code already exists');
      }
      
      const coupon = this.couponsRepository.create({
          code,
          value,
          type,
          razorpayOfferId,
          maxUses,
          validUntil,
      });
      return this.couponsRepository.save(coupon);
  }

  async findAll() {
      return this.couponsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async validateCoupon(code: string) {
      const coupon = await this.couponsRepository.findOne({ where: { code } });
      
      if (!coupon) {
          throw new NotFoundException('Invalid coupon code');
      }

      if (!coupon.isActive) {
          throw new BadRequestException('Coupon is inactive');
      }

      if (coupon.validUntil && new Date() > coupon.validUntil) {
           throw new BadRequestException('Coupon has expired');
      }

      if (coupon.maxUses !== -1 && coupon.usedCount >= coupon.maxUses) {
          throw new BadRequestException('Coupon usage limit reached');
      }

      return coupon;
  }

  async incrementUsage(code: string) {
      const coupon = await this.validateCoupon(code);
      coupon.usedCount += 1;
      await this.couponsRepository.save(coupon);
  }
}

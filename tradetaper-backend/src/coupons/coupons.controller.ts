import { Controller, Post, Body, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CouponsService } from './services/coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validate(@Query('code') code: string) {
      return this.couponsService.validateCoupon(code);
  }
  
  // Admin only - simplified here, ideally guarded by AdminGuard
  @Post()
  async create(@Body() body: any) {
      return this.couponsService.create(
          body.code, 
          body.value, 
          body.type, 
          body.razorpayOfferId, 
          body.maxUses, 
          body.validUntil
      );
  }

  @Get()
  async findAll() {
      return this.couponsService.findAll();
  }
}

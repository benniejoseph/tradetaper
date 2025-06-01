// src/trades/trades.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request as NestRequest,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path
import { UserResponseDto } from '../users/dto/user-response.dto'; // Adjust path
import { Trade } from './entities/trade.entity';

@UseGuards(JwtAuthGuard) // Protect all routes in this controller
@Controller('trades') // Route prefix /api/v1/trades
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTradeDto: CreateTradeDto,
    @NestRequest() req: ExpressRequest,
  ): Promise<Trade> {
    const user = req.user as UserResponseDto;
    return this.tradesService.create(createTradeDto, user);
  }

  @Get()
  findAll(
    @NestRequest() req: ExpressRequest,
    @Query('accountId') accountId?: string,
  ): Promise<Trade[]> {
    const user = req.user as UserResponseDto;
    return this.tradesService.findAll(user, accountId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @NestRequest() req: ExpressRequest,
  ): Promise<Trade> {
    const user = req.user as UserResponseDto;
    const result = this.tradesService.findOne(id, user);
    return result;
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTradeDto: UpdateTradeDto,
    @NestRequest() req: ExpressRequest,
  ): Promise<Trade> {
    const user = req.user as UserResponseDto;
    return this.tradesService.update(id, updateTradeDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @NestRequest() req: ExpressRequest,
  ): Promise<void> {
    const user = req.user as UserResponseDto;
    return this.tradesService.remove(id, user);
  }
}

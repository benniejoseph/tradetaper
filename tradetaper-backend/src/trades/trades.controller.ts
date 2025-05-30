// src/trades/trades.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseUUIDPipe, HttpCode, HttpStatus, Query
} from '@nestjs/common';
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
  create(@Body() createTradeDto: CreateTradeDto, @Request() req): Promise<Trade> {
    const user: UserResponseDto = req.user;
    return this.tradesService.create(createTradeDto, user);
  }

  @Get()
  findAll(@Request() req, /* @Query() queryParams: any */): Promise<Trade[]> { // Add query params for filtering/pagination later
    const user: UserResponseDto = req.user;
    return this.tradesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<Trade> {
    const user: UserResponseDto = req.user;
    return this.tradesService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTradeDto: UpdateTradeDto,
    @Request() req
  ): Promise<Trade> {
    const user: UserResponseDto = req.user;
    return this.tradesService.update(id, updateTradeDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<void> {
    const user: UserResponseDto = req.user;
    return this.tradesService.remove(id, user);
  }
}
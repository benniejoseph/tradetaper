import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('strategies')
@UseGuards(JwtAuthGuard)
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post()
  async create(@Body() createStrategyDto: CreateStrategyDto, @Request() req) {
    return this.strategiesService.create(createStrategyDto, req.user.userId);
  }

  @Get()
  async findAll(@Request() req) {
    return this.strategiesService.findAll(req.user.userId);
  }

  @Get('with-stats')
  async getAllWithStats(@Request() req) {
    return this.strategiesService.getAllStrategiesWithStats(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.strategiesService.findOne(id, req.user.userId);
  }

  @Get(':id/stats')
  async getStats(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.strategiesService.getStrategyStats(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStrategyDto: UpdateStrategyDto,
    @Request() req,
  ) {
    return this.strategiesService.update(
      id,
      updateStrategyDto,
      req.user.userId,
    );
  }

  @Patch(':id/toggle-active')
  async toggleActive(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.strategiesService.toggleActive(id, req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.strategiesService.remove(id, req.user.userId);
    return { message: 'Strategy deleted successfully' };
  }
}

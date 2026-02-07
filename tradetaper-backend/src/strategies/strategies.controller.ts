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
import { UsageLimitGuard, UsageFeature } from '../subscriptions/guards/usage-limit.guard';

@Controller('strategies')
@UseGuards(JwtAuthGuard)
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post()
  @UseGuards(UsageLimitGuard)
  @UsageFeature('strategies')
  async create(@Body() createStrategyDto: CreateStrategyDto, @Request() req) {
    return this.strategiesService.create(createStrategyDto, req.user.id);
  }

  @Get()
  async findAll(@Request() req) {
    return this.strategiesService.findAll(req.user.id);
  }

  @Get('with-stats')
  async getAllWithStats(@Request() req) {
    return this.strategiesService.getAllStrategiesWithStats(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.strategiesService.findOne(id, req.user.id);
  }

  @Get(':id/stats')
  async getStats(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.strategiesService.getStrategyStats(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStrategyDto: UpdateStrategyDto,
    @Request() req,
  ) {
    return this.strategiesService.update(id, updateStrategyDto, req.user.id);
  }

  @Patch(':id/toggle-active')
  async toggleActive(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.strategiesService.toggleActive(id, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.strategiesService.remove(id, req.user.id);
    return { message: 'Strategy deleted successfully' };
  }
}

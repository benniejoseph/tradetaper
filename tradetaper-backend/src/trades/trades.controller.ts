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
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { TradesService } from "./trades.service";
import { CreateTradeDto } from "./dto/create-trade.dto";
import { UpdateTradeDto } from "./dto/update-trade.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Trade } from "./entities/trade.entity";

@UseGuards(JwtAuthGuard)
@Controller("trades")
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTradeDto: CreateTradeDto, @Request() req): Promise<Trade> {
    return this.tradesService.create(createTradeDto, req.user);
  }

  @Get()
  findAll(@Request() req, @Query("accountId") accountId?: string): Promise<Trade[]> {
    return this.tradesService.findAll(req.user, accountId);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string, @Request() req): Promise<Trade> {
    return this.tradesService.findOne(id, req.user);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTradeDto: UpdateTradeDto,
    @Request() req,
  ): Promise<Trade> {
    return this.tradesService.update(id, updateTradeDto, req.user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseUUIDPipe) id: string, @Request() req): Promise<void> {
    return this.tradesService.remove(id, req.user);
  }
}

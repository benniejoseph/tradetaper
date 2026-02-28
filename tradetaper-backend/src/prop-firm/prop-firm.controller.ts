import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';
import { PropFirmService, CreatePropFirmChallengeDto, UpdatePropFirmChallengeDto } from './prop-firm.service';

@Controller('prop-firm-challenges')
@UseGuards(JwtAuthGuard)
export class PropFirmController {
  constructor(private readonly propFirmService: PropFirmService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePropFirmChallengeDto) {
    return this.propFirmService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.propFirmService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.propFirmService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePropFirmChallengeDto,
  ) {
    return this.propFirmService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.propFirmService.remove(req.user.id, id);
  }
}

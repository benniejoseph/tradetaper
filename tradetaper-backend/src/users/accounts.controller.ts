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
  BadRequestException,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto, AccountResponseDto } from './dto/account.dto';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  async create(
    @Request() req,
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountsService.create(createAccountDto, req.user);
  }

  @Get()
  async findAll(@Request() req): Promise<AccountResponseDto[]> {
    return this.accountsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id') id: string,
  ): Promise<AccountResponseDto> {
    const account = await this.accountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('Account not found');
    }
    return this.accountsService.mapToResponseDto(account);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    const account = await this.accountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('Account not found');
    }
    return this.accountsService.update(id, updateAccountDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string): Promise<void> {
    const account = await this.accountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('Account not found');
    }
    await this.accountsService.remove(id);
  }
} 
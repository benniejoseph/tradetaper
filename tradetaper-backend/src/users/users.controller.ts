import {
  Controller,
  Get,
  Patch,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUsernameDto } from './dto/update-username.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('username')
  updateUsername(@Request() req, @Body() dto: UpdateUsernameDto) {
    return this.usersService.updateUsername(req.user.id, dto.username);
  }

  @Get('username-availability')
  async checkUsernameAvailability(@Query('username') username?: string) {
    if (!username) {
      return { available: false };
    }
    const available = await this.usersService.isUsernameAvailable(username);
    return { available };
  }
}

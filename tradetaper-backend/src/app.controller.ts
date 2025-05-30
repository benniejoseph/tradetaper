import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() // Will be prefixed by 'api/v1'
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  getTestMessage(): { message: string } {
    return this.appService.getTestMessage();
  }
}
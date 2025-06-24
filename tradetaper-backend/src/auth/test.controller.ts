import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  test() {
    return { message: 'Test controller working', timestamp: new Date().toISOString() };
  }

  @Get('google')
  testGoogle() {
    return { message: 'Test Google endpoint working', timestamp: new Date().toISOString() };
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World from Trading Journal API!';
  }

  getTestMessage(): { message: string } {
    return { message: 'This is a test message from the backend!' };
  }
}

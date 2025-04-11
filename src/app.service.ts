import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  version() {
    return {
      appName: 'Attend Smart Admin',
      version: 'v1.0',
    };
  }
}

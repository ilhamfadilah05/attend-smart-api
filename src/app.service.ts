import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  version() {
    return {
      appName: 'Dana mini program',
      version: 'v1.0',
    };
  }
}

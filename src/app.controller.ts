import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { GoogleCloudStorage } from './libs/service/gcs/google-cloud-storage.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly gcs: GoogleCloudStorage,
  ) {}

  @Get('files')
  async getHello() {
    return {
      files: await this.gcs.listFiles(),
    };
  }

  @Get('version')
  version() {
    return this.appService.version();
  }
}

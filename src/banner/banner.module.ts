import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { GoogleCloudStorage } from 'src/libs/service/gcs/google-cloud-storage.service';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [BannerController],
  providers: [BannerService, GoogleCloudStorage],
})
export class BannerModule {}

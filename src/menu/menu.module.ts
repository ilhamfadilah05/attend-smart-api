import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { GoogleCloudStorage } from 'src/libs/service/gcs/google-cloud-storage.service';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [MenuController],
  providers: [MenuService, GoogleCloudStorage],
})
export class MenuModule {}

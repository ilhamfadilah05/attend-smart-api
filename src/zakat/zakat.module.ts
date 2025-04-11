import { Module } from '@nestjs/common';
import { ZakatService } from './zakat.service';
import { ZakatController } from './zakat.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { GoogleCloudStorage } from 'src/libs/service/gcs/google-cloud-storage.service';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [ZakatController],
  providers: [ZakatService, GoogleCloudStorage],
})
export class ZakatModule {}

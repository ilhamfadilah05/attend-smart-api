import { Module } from '@nestjs/common';
import { SedekahService } from './sedekah.service';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { SedekahController } from './sedekah.controller';
import { GoogleCloudStorage } from 'src/libs/service/gcs/google-cloud-storage.service';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [SedekahController],
  providers: [SedekahService, GoogleCloudStorage],
})
export class SedekahModule {}

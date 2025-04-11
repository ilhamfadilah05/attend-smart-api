import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { GoogleCloudStorage } from 'src/libs/service/gcs/google-cloud-storage.service';
import { CategoryService } from 'src/category/category.service';

@Module({
  imports: [HelperModule, DatabaseModule],
  controllers: [CampaignController],
  providers: [CampaignService, GoogleCloudStorage, CategoryService],
})
export class CampaignModule {}

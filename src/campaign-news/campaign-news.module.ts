import { Module } from '@nestjs/common';
import { CampaignNewsService } from './campaign-news.service';
import { CampaignNewsController } from './campaign-news.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [CampaignNewsController],
  providers: [CampaignNewsService],
})
export class CampaignNewsModule {}

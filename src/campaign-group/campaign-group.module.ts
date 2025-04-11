import { Module } from '@nestjs/common';
import { CampaignGroupService } from './campaign-group.service';
import { CampaignGroupController } from './campaign-group.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [CampaignGroupController],
  providers: [CampaignGroupService],
})
export class CampaignGroupModule {}

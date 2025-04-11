import { Module } from '@nestjs/common';
import { UserActivityController } from './user-activity.controller';
import { UserActivityService } from './user-activity.service';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [UserActivityController],
  providers: [UserActivityService],
})
export class UserActivityModule {}

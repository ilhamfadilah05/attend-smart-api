import { Module } from '@nestjs/common';
import { BroadcastSendService } from './broadcast-send.service';
import { BroadcastSendController } from './broadcast-send.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [BroadcastSendController],
  providers: [BroadcastSendService],
})
export class BroadcastSendModule {}

import { Module } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { BroadcastController } from './broadcast.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { FirebaseStorageService } from 'src/libs/service/firebase/firebase-storage.service';
import { FirebaseMessagingService } from 'src/libs/service/firebase/firebase-messaging.service';
import { BroadcastSendService } from 'src/broadcast-send/broadcast-send.service';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [BroadcastController],
  providers: [
    BroadcastService,
    FirebaseStorageService,
    FirebaseMessagingService,
    BroadcastSendService,
  ],
})
export class BroadcastModule {}

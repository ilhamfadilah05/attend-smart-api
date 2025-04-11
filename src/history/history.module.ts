import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { FirebaseStorageService } from 'src/libs/service/firebase/firebase-storage.service';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [HistoryController],
  providers: [HistoryService, FirebaseStorageService],
})
export class HistoryModule {}

import { Module } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { FirebaseStorageService } from 'src/libs/service/firebase/firebase-storage.service';
import { HistoryService } from 'src/history/history.service';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [SubmissionController],
  providers: [SubmissionService, FirebaseStorageService, HistoryService],
})
export class SubmissionModule {}

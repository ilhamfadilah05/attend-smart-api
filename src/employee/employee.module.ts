import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { FirebaseStorageService } from 'src/libs/service/firebase/firebase-storage.service';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [EmployeeController],
  providers: [EmployeeService, FirebaseStorageService],
})
export class EmployeeModule {}

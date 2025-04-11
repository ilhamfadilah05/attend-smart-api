import { Module } from '@nestjs/common';
import { PayslipService } from './payslip.service';
import { PayslipController } from './payslip.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { EmployeeService } from 'src/employee/employee.service';
import { SalaryService } from 'src/salary/salary.service';
import { FirebaseStorageService } from 'src/libs/service/firebase/firebase-storage.service';
import { HistoryService } from 'src/history/history.service';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [PayslipController],
  providers: [
    PayslipService,
    EmployeeService,
    SalaryService,
    FirebaseStorageService,
    HistoryService,
  ],
})
export class PayslipModule {}

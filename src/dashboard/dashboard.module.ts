import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PayslipService } from 'src/payslip/payslip.service';
import { FirebaseStorageService } from 'src/libs/service/firebase/firebase-storage.service';
import { HistoryService } from 'src/history/history.service';
import { EmployeeService } from 'src/employee/employee.service';
import { SalaryService } from 'src/salary/salary.service';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    PayslipService,
    FirebaseStorageService,
    HistoryService,
    EmployeeService,
    SalaryService,
  ],
})
export class DashboardModule {}

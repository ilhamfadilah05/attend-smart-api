import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Branch } from '../entities/branch.entity';
import { Broadcast } from '../entities/broadcast.entity';
import { BroadcastSend } from '../entities/broadcast-send.entity';
import { Department } from '../entities/department.entity';
import { Salary } from '../entities/salary.entity';
import { Submission } from '../entities/submission.entity';
import { Employee } from '../entities/employee.entity';
import { History } from '../entities/history.entity';
import { Payslip } from '../entities/payslip.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Campaign,
      User,
      Role,
      // CampaginGroup,
      // Config,
      // UserActivity,
      // City,
      // Province,
      // Transaction,
      // TransactionItem,
      // Banner,
      // CampaignNews,
      // Menu,
      // Donor,
      Employee,
      Branch,
      Broadcast,
      BroadcastSend,
      Department,
      Salary,
      Submission,
      History,
      Payslip,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { Keyv } from '@keyv/redis';
import { CaslModule } from './libs/casl/casl.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './libs/exception/exception-filter';
import { InjectDataHelper } from './libs/helper/inject-data.helper';
import { DatabaseModule } from './libs/database/database.module';
import { UserActivityInterceptor } from './libs/interceptor/user-activity.interceptor';
import { GoogleCloudStorage } from './libs/service/gcs/google-cloud-storage.service';
import { EmployeeModule } from './employee/employee.module';
import { BranchModule } from './branch/branch.module';
import { BroadcastModule } from './broadcast/broadcast.module';
import { BroadcastSendModule } from './broadcast-send/broadcast-send.module';
import { DepartmentModule } from './department/department.module';
import { SalaryModule } from './salary/salary.module';
import { SubmissionModule } from './submission/submission.module';
import { HistoryModule } from './history/history.module';
import { User } from './libs/entities/user.entity';
import { Role } from './libs/entities/role.entity';
import { Employee } from './libs/entities/employee.entity';
import { Branch } from './libs/entities/branch.entity';
import { Broadcast } from './libs/entities/broadcast.entity';
import { BroadcastSend } from './libs/entities/broadcast-send.entity';
import { Department } from './libs/entities/department.entity';
import { Salary } from './libs/entities/salary.entity';
import { Submission } from './libs/entities/submission.entity';
import { History } from './libs/entities/history.entity';
import { PayslipModule } from './payslip/payslip.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Payslip } from './libs/entities/payslip.entity';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRE_DB_HOST,
      port: Number(process.env.POSTGRE_DB_PORT),
      username: process.env.POSTGRE_DB_USERNAME,
      password: process.env.POSTGRE_DB_PASSWORD,
      database: process.env.POSTGRE_DB_NAME,
      entities: [
        // __dirname + '/**/*.entity.{js,ts}'
        User,
        Role,
        Employee,
        Branch,
        Broadcast,
        BroadcastSend,
        Department,
        Salary,
        Submission,
        History,
        Payslip,
      ],
      synchronize: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
      global: true,
    }),
    CacheModule.registerAsync({
      useFactory: async () => {
        const store = new Keyv({
          store: new KeyvRedis({
            password: process.env.REDIS_PASSWORD,
            socket: {
              host: process.env.REDIS_HOST,
              port: +process.env.REDIS_PORT,
            },
          }),
        });
        return {
          store,
        };
      },
      isGlobal: true,
    }),
    DatabaseModule,
    CaslModule,
    AuthModule,
    UserModule,
    RoleModule,
    // UserActivityModule,
    // CategoryModule,
    // CampaignModule,
    // CampaignGroupModule,
    // GlobalConfigModule,
    // CityModule,
    // ProvinceModule,
    // TransactionModule,
    // BannerModule,
    // ZakatModule,
    // CampaignNewsModule,
    // MenuModule,
    // SedekahModule,
    // SandraModule,
    // DonorModule,
    // CategoryModule,
    // CampaignModule,
    // CampaignGroupModule,
    // GlobalConfigModule,
    // CityModule,
    // ProvinceModule,
    // TransactionModule,
    // BannerModule,
    // ZakatModule,
    // CampaignNewsModule,
    // MenuModule,

    EmployeeModule,
    BranchModule,
    BroadcastModule,
    BroadcastSendModule,
    DepartmentModule,
    SalaryModule,
    SubmissionModule,
    HistoryModule,
    PayslipModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    InjectDataHelper,
    GoogleCloudStorage,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: UserActivityInterceptor },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailModule } from 'src/libs/service/mail/mail.module';

@Module({
  imports: [DatabaseModule, HelperModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

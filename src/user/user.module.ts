import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HelperModule } from 'src/libs/helper/helper.module';
import { DatabaseModule } from 'src/libs/database/database.module';

@Module({
  imports: [HelperModule, DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

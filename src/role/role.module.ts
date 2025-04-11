import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { HelperModule } from 'src/libs/helper/helper.module';
import { DatabaseModule } from 'src/libs/database/database.module';

@Module({
  imports: [HelperModule, DatabaseModule],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}

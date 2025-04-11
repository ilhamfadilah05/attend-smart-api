import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [BranchController],
  providers: [BranchService],
})
export class BranchModule {}

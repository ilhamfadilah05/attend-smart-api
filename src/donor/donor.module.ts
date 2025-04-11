import { Module } from '@nestjs/common';
import { DonorService } from './donor.service';
import { DonorController } from './donor.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [DonorController],
  providers: [DonorService],
})
export class DonorModule {}

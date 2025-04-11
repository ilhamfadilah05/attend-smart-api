import { Module } from '@nestjs/common';
import { ProvinceService } from './province.service';
import { ProvinceController } from './province.controller';
import { DatabaseModule } from 'src/libs/database/database.module';
import { HelperModule } from 'src/libs/helper/helper.module';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [ProvinceController],
  providers: [ProvinceService],
})
export class ProvinceModule {}

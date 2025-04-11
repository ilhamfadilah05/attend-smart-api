import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { HelperModule } from 'src/libs/helper/helper.module';
import { CategoryService } from './category.service';
import { DatabaseModule } from 'src/libs/database/database.module';

@Module({
  imports: [DatabaseModule, HelperModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}

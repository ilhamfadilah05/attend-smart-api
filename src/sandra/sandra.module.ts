import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HelperModule } from 'src/libs/helper/helper.module';
import { SandraController } from './sandra.controller';
import { SandraService } from './sandra.service';
import { SandraHelperService } from 'src/libs/service/sandra/sandra.service';

@Module({
  imports: [HttpModule, HelperModule],
  controllers: [SandraController],
  providers: [SandraService, SandraHelperService],
})
export class SandraModule {}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { SandraService } from './sandra.service';
import { ListSandraProjectDto } from './dto/list-sandra-project.dto';

@ApiTags('Sandra')
@Controller({ path: PATH.SANDRA, version: '1' })
export class SandraController {
  constructor(private service: SandraService) {}

  @ApiOperation({ summary: 'Get sandra program' })
  @ApiBearerAuth()
  @Oacl(`${PATH.SANDRA}/programs`, 'read', 'Melihat data sandra program')
  @Get()
  findProgram() {
    return this.service.findProgram();
  }

  @ApiOperation({ summary: 'Get sandra project' })
  @ApiBearerAuth()
  @Oacl(`${PATH.SANDRA}/projects`, 'read', 'Melihat data sandra project')
  @Get()
  findProject(@Query() query: ListSandraProjectDto) {
    return this.service.findProject(query);
  }

  @ApiOperation({ summary: 'Get sandra qurban' })
  @ApiBearerAuth()
  @Oacl(`${PATH.SANDRA}/qurbans`, 'read', 'Melihat data sandra hewan')
  @Get()
  findQurban() {
    return this.service.findQurban();
  }
}

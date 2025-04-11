import { Controller, Body, Param, Query } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { PATH } from 'src/libs/constant';
import { ListSalaryDto } from './dto/list-salary.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('Salary')
@Controller({ path: PATH.SALARY, version: '1' })
export class SalaryController {
  constructor(private readonly service: SalaryService) {}

  @ApiOperation({ summary: 'Create salary' })
  @ApiBearerAuth()
  @Oacl(PATH.SALARY, 'create', 'Untuk melihat data salary')
  create(@Body() payload: CreateSalaryDto) {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Get all salary' })
  @ApiBearerAuth()
  @Oacl(PATH.SALARY, 'read', 'Untuk melihat data salary')
  findAll(@Query() query: ListSalaryDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @ApiBearerAuth()
  @Oacl(`${PATH.SALARY}/:id`, 'read', 'Untuk memperbarui salary')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update salary' })
  @ApiBearerAuth()
  @Oacl(`${PATH.SALARY}/:id`, 'update', 'Untuk memperbarui salary')
  update(@Param('id', UUIDPipe) id: string, @Body() payload: UpdateSalaryDto) {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete salary' })
  @ApiBearerAuth()
  @Oacl(`${PATH.SALARY}/:id`, 'delete', 'Untuk menghapus salary')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

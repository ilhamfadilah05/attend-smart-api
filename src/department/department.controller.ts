import { Controller, Body, Param, Query } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { PATH } from 'src/libs/constant';
import { ListDepartmentDto } from './dto/list-department.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('Department')
@Controller({ path: PATH.DEPARTMENT, version: '1' })
export class DepartmentController {
  constructor(private readonly service: DepartmentService) {}

  @ApiOperation({ summary: 'Create department' })
  @ApiBearerAuth()
  @Oacl(PATH.DEPARTMENT, 'create', 'Untuk melihat data department')
  create(@Body() payload: CreateDepartmentDto) {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Get all department' })
  @ApiBearerAuth()
  @Oacl(PATH.DEPARTMENT, 'read', 'Untuk melihat data department')
  findAll(@Query() query: ListDepartmentDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @ApiBearerAuth()
  @Oacl(`${PATH.DEPARTMENT}/:id`, 'read', 'Untuk memperbarui department')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update department' })
  @ApiBearerAuth()
  @Oacl(`${PATH.DEPARTMENT}/:id`, 'update', 'Untuk memperbarui department')
  update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateDepartmentDto,
  ) {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete department' })
  @ApiBearerAuth()
  @Oacl(`${PATH.DEPARTMENT}/:id`, 'delete', 'Untuk menghapus department')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

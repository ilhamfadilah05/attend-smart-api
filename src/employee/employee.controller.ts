import {
  Controller,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { PATH } from 'src/libs/constant';
import { ListEmployeeDto } from './dto/list-employee.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';
import { multerOptions } from 'src/libs/helper/common.helper';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Employee')
@Controller({ path: PATH.EMPLOYEE, version: '1' })
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  @ApiOperation({ summary: 'Create employee' })
  @ApiBearerAuth()
  @Oacl(PATH.EMPLOYEE, 'create', 'Untuk melihat data employee')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  create(
    @Body() payload: CreateEmployeeDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.create(payload, image);
  }

  @ApiOperation({ summary: 'Get all employee' })
  @ApiBearerAuth()
  @Oacl(PATH.EMPLOYEE, 'read', 'Untuk melihat data employee')
  findAll(@Query() query: ListEmployeeDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @ApiBearerAuth()
  @Oacl(`${PATH.EMPLOYEE}/:id`, 'read', 'Untuk memperbarui employee')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update employee' })
  @ApiBearerAuth()
  @Oacl(`${PATH.EMPLOYEE}/:id`, 'update', 'Untuk memperbarui employee')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateEmployeeDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.update(id, payload, image);
  }

  @ApiOperation({ summary: 'Delete employee' })
  @ApiBearerAuth()
  @Oacl(`${PATH.EMPLOYEE}/:id`, 'delete', 'Untuk menghapus employee')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

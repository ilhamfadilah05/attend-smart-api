import { Controller, Body, Param, Query } from '@nestjs/common';
import { PayslipService } from './payslip.service';
import { CreatePayslipDto } from './dto/create-payslip.dto';
import { UpdatePayslipDto } from './dto/update-payslip.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { PATH } from 'src/libs/constant';
import { ListPayslipDto } from './dto/list-payslip.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('Payslip')
@Controller({ path: PATH.PAYSLIP, version: '1' })
export class PayslipController {
  constructor(private readonly service: PayslipService) {}

  @ApiOperation({ summary: 'Create payslip' })
  @ApiBearerAuth()
  @Oacl(PATH.PAYSLIP, 'create', 'Untuk melihat data payslip')
  create(@Body() payload: CreatePayslipDto) {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Get all payslip' })
  @ApiBearerAuth()
  @Oacl(PATH.PAYSLIP, 'read', 'Untuk melihat data payslip')
  findAll(@Query() query: ListPayslipDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @ApiBearerAuth()
  @Oacl(`${PATH.PAYSLIP}/:id`, 'read', 'Untuk memperbarui payslip')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update payslip' })
  @ApiBearerAuth()
  @Oacl(`${PATH.PAYSLIP}/:id`, 'update', 'Untuk memperbarui payslip')
  update(@Param('id', UUIDPipe) id: string, @Body() payload: UpdatePayslipDto) {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete payslip' })
  @ApiBearerAuth()
  @Oacl(`${PATH.PAYSLIP}/:id`, 'delete', 'Untuk menghapus payslip')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

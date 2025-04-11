import { Controller, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { DashboardService } from './dashboard.service';
import { ListDashboardDto } from './dto/list-dashboard.dto';

@ApiTags('Dashboard')
@Controller({
  version: '1',
  path: PATH.DASHBOARD,
})
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @ApiOperation({ summary: 'Get data dashboard' })
  @ApiBearerAuth()
  @Oacl(`${PATH.DASHBOARD}/app`, 'read', 'Untuk melihat data dashboard')
  findAll(@Query() query: ListDashboardDto) {
    return this.service.findAll(query);
  }
}

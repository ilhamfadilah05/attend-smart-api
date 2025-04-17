import { Controller, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { DashboardService } from './dashboard.service';
import {
  DashboardStatisticDto,
  ListDashboardDto,
} from './dto/list-dashboard.dto';

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

  @ApiOperation({ summary: 'Get data dashboard' })
  @ApiBearerAuth()
  @Oacl(
    `${PATH.DASHBOARD}/admin/total-data`,
    'read',
    'Untuk melihat data dashboard',
  )
  findAdminTotalData() {
    return this.service.getTotalDataAdmin();
  }

  @ApiOperation({ summary: 'Get data dashboard' })
  @ApiBearerAuth()
  @Oacl(
    `${PATH.DASHBOARD}/admin/in-out`,
    'read',
    'Untuk melihat data dashboard',
  )
  findAdminInOut() {
    return this.service.getDataInOutAdmin();
  }

  @ApiOperation({ summary: 'Get data dashboard' })
  @ApiBearerAuth()
  @Oacl(
    `${PATH.DASHBOARD}/admin/statistics`,
    'read',
    'Untuk melihat data dashboard',
  )
  findStatistics(@Query() query: DashboardStatisticDto) {
    return this.service.getDataStatisticAdmin(query);
  }
}

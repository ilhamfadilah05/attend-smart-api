import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { ListUserActivityDto } from './dto/list-user-activity.dto';
import { UserActivityService } from './user-activity.service';
import { PATH } from 'src/libs/constant';
import { AuthGuard } from 'src/libs/guard/auth.guard';
import { AuthUser } from 'src/libs/decorator/auth.decorator';
import { IJwtPayload } from 'src/libs/interface';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('User Activity')
@Controller({ path: PATH.USER_ACTIVITY, version: '1' })
export class UserActivityController {
  constructor(private readonly service: UserActivityService) {}

  @ApiOperation({ summary: 'Get user activities' })
  @ApiBearerAuth()
  @Oacl(PATH.USER_ACTIVITY, 'read', 'Untuk melihat data Aktifitas Pengguna')
  async findAll(@Query() query: ListUserActivityDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get current user activities' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  async findMe(
    @AuthUser() user: IJwtPayload,
    @Query() query: ListUserActivityDto,
  ) {
    return this.service.findAll(query, user.id);
  }

  @ApiOperation({ summary: 'Get user activities' })
  @ApiBearerAuth()
  @Oacl(
    `${PATH.USER_ACTIVITY}/:id`,
    'read',
    'Untuk melihat detail data Aktifitas Pengguna',
  )
  async findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}

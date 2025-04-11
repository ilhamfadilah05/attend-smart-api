import { Controller, Body, Param, Query } from '@nestjs/common';
import { CampaignGroupService } from './campaign-group.service';
import { CreateCampaignGroupDto } from './dto/create-campaign-group.dto';
import { UpdateCampaignGroupDto } from './dto/update-campaign-group.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { PATH } from 'src/libs/constant';
import { ListCampaignGroupDto } from './dto/list-campaign-group.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('Campaign Group')
@Controller({ path: PATH.CAMPAIGN_GROUP, version: '1' })
export class CampaignGroupController {
  constructor(private readonly service: CampaignGroupService) {}

  @ApiOperation({ summary: 'Create campaign' })
  @ApiBearerAuth()
  @Oacl(PATH.CAMPAIGN_GROUP, 'create', 'Untuk melihat data kategori')
  async create(@Body() payload: CreateCampaignGroupDto) {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Get all campaign group' })
  @ApiBearerAuth()
  @Oacl(PATH.CAMPAIGN_GROUP, 'read', 'Untuk melihat data kategori')
  async findAll(@Query() query: ListCampaignGroupDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @ApiBearerAuth()
  @Oacl(
    `${PATH.CAMPAIGN_GROUP}/:id`,
    'read',
    'Untuk memperbarui campaign group',
  )
  async findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update campaign group' })
  @ApiBearerAuth()
  @Oacl(
    `${PATH.CAMPAIGN_GROUP}/:id`,
    'update',
    'Untuk memperbarui campaign group',
  )
  async update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateCampaignGroupDto,
  ) {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete campaign group' })
  @ApiBearerAuth()
  @Oacl(
    `${PATH.CAMPAIGN_GROUP}/:id`,
    'delete',
    'Untuk menghapus campaign group',
  )
  async remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

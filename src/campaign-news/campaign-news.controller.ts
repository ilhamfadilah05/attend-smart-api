import { Controller, Body, Param, Query } from '@nestjs/common';
import { CampaignNewsService } from './campaign-news.service';
import { CreateCampaignNewsDto } from './dto/create-campaign-news.dto';
import { UpdateCampaignNewsDto } from './dto/update-campaign-news.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { ListCampaignNewsDto } from './dto/list-campaign-news.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('Campaign news')
@Controller({ path: PATH.CAMPAIGN_NEWS, version: '1' })
export class CampaignNewsController {
  constructor(private readonly service: CampaignNewsService) {}

  @ApiOperation({ summary: 'Create campaign news' })
  @ApiBearerAuth()
  @Oacl(PATH.CAMPAIGN_NEWS, 'create', 'Menambah campaign news')
  create(@Body() payload: CreateCampaignNewsDto) {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Gel all campaign news' })
  @ApiBearerAuth()
  @Oacl(PATH.CAMPAIGN_NEWS, 'read', 'Melihat semua data campaign news')
  findAll(@Query() query: ListCampaignNewsDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign news' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CAMPAIGN_NEWS}/:id`, 'read', 'Melihat satu data campaign news')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update one campaign news' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CAMPAIGN_NEWS}/:id`, 'update', 'Memperbarui satu campaign news')
  update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateCampaignNewsDto,
  ) {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete one campaign news' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CAMPAIGN_NEWS}/:id`, 'delete', 'Menghapus satu campaign news')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

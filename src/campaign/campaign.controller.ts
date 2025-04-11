import {
  Controller,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { ListCampaignDto } from './dto/list-campaign.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/libs/helper/common.helper';
import { AuthUser } from 'src/libs/decorator/auth.decorator';
import { IJwtPayload } from 'src/libs/interface';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('Campaign')
@Controller({ path: PATH.CAMPAIGN, version: '1' })
export class CampaignController {
  constructor(private readonly service: CampaignService) {}

  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Oacl(PATH.CAMPAIGN, 'create', 'Untuk menambahkan campaign')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async create(
    @AuthUser() user: IJwtPayload,
    @Body() payload: CreateCampaignDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.create(payload, user, image);
  }

  @ApiOperation({ summary: 'Get all campaigns' })
  @ApiBearerAuth()
  @Oacl(PATH.CAMPAIGN, 'read', 'Untuk melihat campaign')
  findAll(@Query() query: ListCampaignDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CAMPAIGN}/:id`, 'read', 'Untuk melihat detail campaign')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update existing campaign' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Oacl(`${PATH.CAMPAIGN}/:id`, 'update', 'Untuk memperbarui campaign')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateCampaignDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.update(id, payload, image);
  }

  @ApiOperation({ summary: 'Delete campaign' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CAMPAIGN}/:id`, 'delete', 'Untuk menghapus campaign')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @ApiOperation({ summary: 'Check campaign slug' })
  @ApiBearerAuth()
  @Get('/:slug')
  checkSlug(@Param('slug') slug: string) {
    return this.service.checkSlug(slug);
  }
}

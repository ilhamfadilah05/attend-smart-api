import {
  Controller,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { ListBannerDto } from './dto/list-banner.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/libs/helper/common.helper';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('Banner')
@Controller({ path: PATH.BANNER, version: '1' })
export class BannerController {
  constructor(private readonly service: BannerService) {}

  @ApiOperation({ summary: 'Create a new banner' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Oacl(PATH.CAMPAIGN, 'create', 'Untuk menambahkan banner')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  create(
    @Body() payload: CreateBannerDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.create(payload, image);
  }

  @ApiOperation({ summary: 'Get all banner' })
  @ApiBearerAuth()
  @Oacl(PATH.BANNER, 'read', 'Melihat semua data banner')
  findAll(@Query() query: ListBannerDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one banner ' })
  @ApiBearerAuth()
  @Oacl(`${PATH.BANNER}/:id`, 'read', 'Melihat satu data banner')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update one banner' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Oacl(`${PATH.BANNER}/:id`, 'update', 'Memperbarui satu banner')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateBannerDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.update(id, payload, image);
  }

  @ApiOperation({ summary: 'Delete banner' })
  @ApiBearerAuth()
  @Oacl(`${PATH.BANNER}/:id`, 'delete', 'Menghapus satu banner')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

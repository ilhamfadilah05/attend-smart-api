import {
  Controller,
  Body,
  Param,
  UseInterceptors,
  Query,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ZakatService } from './zakat.service';
import { UpdateZakatDto } from './dto/update-zakat.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { multerOptions } from 'src/libs/helper/common.helper';
import { ListZakatDto } from './dto/list-zakat.dto';

@ApiTags('Zakat')
@Controller({ path: PATH.ZAKAT, version: '1' })
export class ZakatController {
  constructor(private readonly service: ZakatService) {}

  @ApiOperation({ summary: 'Get all zakats' })
  @ApiBearerAuth()
  @Oacl(PATH.ZAKAT, 'read', 'Untuk melihat zakat')
  async findAll(@Query() query: ListZakatDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one zakat' })
  @ApiBearerAuth()
  @Oacl(`${PATH.ZAKAT}/:id`, 'read', 'Untuk melihat detail zakat')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update existing zakat' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Oacl(`${PATH.ZAKAT}/:id`, 'update', 'Untuk memperbarui zakat')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async update(
    @Param('id') id: string,
    @Body() paylaod: UpdateZakatDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.update(id, paylaod, image);
  }
}

import {
  Controller,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { PATH } from 'src/libs/constant';
import { ListHistoryDto } from './dto/list-history.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';
import { multerOptions } from 'src/libs/helper/common.helper';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('History')
@Controller({ path: PATH.HISTORY, version: '1' })
export class HistoryController {
  constructor(private readonly service: HistoryService) {}

  @ApiOperation({ summary: 'Create history' })
  @ApiBearerAuth()
  @Oacl(PATH.HISTORY, 'create', 'Untuk melihat data history')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  create(
    @Body() payload: CreateHistoryDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.create(payload, image);
  }

  @ApiOperation({ summary: 'Get all history' })
  @ApiBearerAuth()
  @Oacl(PATH.HISTORY, 'read', 'Untuk melihat data history')
  findAll(@Query() query: ListHistoryDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @ApiBearerAuth()
  @Oacl(`${PATH.HISTORY}/:id`, 'read', 'Untuk memperbarui history')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update history' })
  @ApiBearerAuth()
  @Oacl(`${PATH.HISTORY}/:id`, 'update', 'Untuk memperbarui history')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateHistoryDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.update(id, payload, image);
  }

  @ApiOperation({ summary: 'Delete history' })
  @ApiBearerAuth()
  @Oacl(`${PATH.HISTORY}/:id`, 'delete', 'Untuk menghapus history')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

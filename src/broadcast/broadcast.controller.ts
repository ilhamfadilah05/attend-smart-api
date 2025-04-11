import {
  Controller,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Post,
} from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { PATH } from 'src/libs/constant';
import { ListBroadcastDto } from './dto/list-broadcast.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';
import { multerOptions } from 'src/libs/helper/common.helper';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Broadcast')
@Controller({ path: PATH.BROADCAST, version: '1' })
export class BroadcastController {
  constructor(private readonly service: BroadcastService) {}

  @ApiOperation({ summary: 'Create broadcast' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Oacl(PATH.BROADCAST, 'create', 'Untuk melihat data broadcast')
  create(
    @Body() payload: CreateBroadcastDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.create(payload, image);
  }

  @ApiOperation({ summary: 'Get all broadcast' })
  @ApiBearerAuth()
  @Oacl(PATH.BROADCAST, 'read', 'Untuk melihat data broadcast')
  findAll(@Query() query: ListBroadcastDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @ApiBearerAuth()
  @Oacl(`${PATH.BROADCAST}/:id`, 'read', 'Untuk memperbarui broadcast')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post(`send/:id`)
  @ApiOperation({ summary: 'Send broadcast' })
  @ApiBearerAuth()
  @Oacl(`${PATH.BROADCAST}/send/:id`, 'read', 'Untuk mengirim broadcast')
  sendAll(@Param('id', UUIDPipe) id: string) {
    return this.service.sendBroadcast(id);
  }

  @ApiOperation({ summary: 'Update broadcast' })
  @ApiBearerAuth()
  @Oacl(`${PATH.BROADCAST}/:id`, 'update', 'Untuk memperbarui broadcast')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateBroadcastDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.update(id, payload, image);
  }

  @ApiOperation({ summary: 'Delete broadcast' })
  @ApiBearerAuth()
  @Oacl(`${PATH.BROADCAST}/:id`, 'delete', 'Untuk menghapus broadcast')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

import { Controller, Body, Param, Query } from '@nestjs/common';
import { BroadcastSendService } from './broadcast-send.service';
import { CreateBroadcastSendDto } from './dto/create-broadcast-send.dto';
import { UpdateBroadcastSendDto } from './dto/update-broadcast-send.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { PATH } from 'src/libs/constant';
import { ListBroadcastSendDto } from './dto/list-broadcast-send.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('BroadcastSend')
@Controller({ path: PATH.BROADCAST_SEND, version: '1' })
export class BroadcastSendController {
  constructor(private readonly service: BroadcastSendService) {}

  @ApiOperation({ summary: 'Create broadcastsend' })
  @ApiBearerAuth()
  @Oacl(PATH.BROADCAST_SEND, 'create', 'Untuk melihat data broadcastsend')
  create(@Body() payload: CreateBroadcastSendDto) {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Get all broadcastsend' })
  @ApiBearerAuth()
  @Oacl(PATH.BROADCAST_SEND, 'read', 'Untuk melihat data broadcastsend')
  findAll(@Query() query: ListBroadcastSendDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @ApiBearerAuth()
  @Oacl(`${PATH.BROADCAST_SEND}/:id`, 'read', 'Untuk memperbarui broadcastsend')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Get count broadcast send' })
  @ApiBearerAuth()
  @Oacl(
    `${PATH.BROADCAST_SEND}/count/:id_employee`,
    'read',
    'Untuk memperbarui broadcastsend',
  )
  findCount(@Param('id_employee') id: string) {
    return this.service.countBroadcastSendsNotRead(id);
  }

  @ApiOperation({ summary: 'Update broadcastsend' })
  @ApiBearerAuth()
  @Oacl(
    `${PATH.BROADCAST_SEND}/:id`,
    'update',
    'Untuk memperbarui broadcastsend',
  )
  update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateBroadcastSendDto,
  ) {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete broadcastsend' })
  @ApiBearerAuth()
  @Oacl(`${PATH.BROADCAST_SEND}/:id`, 'delete', 'Untuk menghapus broadcastsend')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

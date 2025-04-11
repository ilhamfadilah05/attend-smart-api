import { Controller, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';
import { ConfigService } from './config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { ListConfigDto } from './dto/list-config.dto';

@ApiTags('Config')
@Controller({ path: PATH.CONFIG, version: '1' })
export class ConfigController {
  constructor(private readonly service: ConfigService) {}

  @ApiOperation({ summary: 'Create config' })
  @ApiBearerAuth()
  @Oacl(PATH.CONFIG, 'create', 'Menambah config')
  create(@Body() payload: CreateConfigDto) {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Get all config' })
  @ApiBearerAuth()
  @Oacl(PATH.CONFIG, 'read', 'Melihat semua data config')
  findAll(@Query() query: ListConfigDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one config' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CONFIG}/:id`, 'read', 'Melihat satu data config')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update one config' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CONFIG}/:id`, 'update', 'Memperbarui satu config')
  update(@Param('id', UUIDPipe) id: string, @Body() payload: UpdateConfigDto) {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete one config' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CONFIG}/:id`, 'delete', 'Menghapus satu config')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

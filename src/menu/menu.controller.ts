import {
  Controller,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { ListMenuDto } from './dto/list-menu.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/libs/helper/common.helper';

@ApiTags('Menu')
@Controller({ path: PATH.MENU, version: '1' })
export class MenuController {
  constructor(private readonly service: MenuService) {}

  @ApiOperation({ summary: 'Create new menu' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Oacl(PATH.MENU, 'create', 'Untuk menambahkan menu')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  create(
    @Body() payload: CreateMenuDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.create(payload, image);
  }

  @ApiOperation({ summary: 'Get all menu' })
  @ApiBearerAuth()
  @Oacl(PATH.MENU, 'read', 'Melihat semua menu')
  findAll(@Query() query: ListMenuDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one menu' })
  @ApiBearerAuth()
  @Oacl(`${PATH.MENU}/:id`, 'read', 'Melihat satu data menu')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update one menu' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Oacl(`${PATH.MENU}/:id`, 'update', 'Memperbarui satu menu')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateMenuDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.update(id, payload, image);
  }

  @ApiOperation({ summary: 'Delete one menu' })
  @ApiBearerAuth()
  @Oacl(`${PATH.MENU}/:id`, 'delete', 'Menghapus satu menu')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

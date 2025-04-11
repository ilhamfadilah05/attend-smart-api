import { Body, Controller, Param, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoryDto } from './dto/list-category.dto';

@ApiTags('Category')
@Controller({ path: PATH.CATEGORY, version: '1' })
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @ApiOperation({ summary: 'Create category' })
  @ApiBearerAuth()
  @Oacl(PATH.CATEGORY, 'create', 'Membuat kategori')
  async create(@Body() payload: CreateCategoryDto) {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Get categories' })
  @ApiBearerAuth()
  @Oacl(PATH.CATEGORY, 'read', 'Melihat list kategori')
  async findAll(@Query() query: ListCategoryDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one category ' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CATEGORY}/:id`, 'read', 'Melihat detail kategori')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update category' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CATEGORY}/:id`, 'update', 'Memperbarui kategory')
  update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateCategoryDto,
  ) {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete category' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CATEGORY}/:id`, 'delete', 'Menghapus kategori')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

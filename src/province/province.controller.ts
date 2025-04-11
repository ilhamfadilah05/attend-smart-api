import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProvinceService } from './province.service';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-province.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { ListProvincesDto } from './dto/list-province.dto';

@ApiTags('Province')
@Controller({ path: PATH.PROVINCE, version: '1' })
export class ProvinceController {
  constructor(private readonly service: ProvinceService) {}

  @Post()
  create(@Body() createProvinceDto: CreateProvinceDto) {
    return this.service.create(createProvinceDto);
  }

  @ApiOperation({ summary: 'Get all provinces' })
  @ApiBearerAuth()
  @Oacl(PATH.PROVINCE, 'read', 'Untuk melihat data kota')
  findAll(@Query() query: ListProvincesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProvinceDto: UpdateProvinceDto,
  ) {
    return this.service.update(+id, updateProvinceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}

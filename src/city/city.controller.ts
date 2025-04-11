import { Controller, Body, Param, Query } from '@nestjs/common';
import { CityService } from './city.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { ListCityDto } from './dto/list-city.dto';

@ApiTags('City')
@Controller({ path: PATH.CITY, version: '1' })
export class CityController {
  constructor(private readonly service: CityService) {}

  @ApiOperation({ summary: 'Create a city' })
  @ApiBearerAuth()
  @Oacl(PATH.CITY, 'create', 'Untuk membuat data kota')
  create(@Body() payload: CreateCityDto) {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Get all cities' })
  @ApiBearerAuth()
  @Oacl(PATH.CITY, 'read', 'Untuk melihat data kota')
  findAll(@Query() query: ListCityDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one city' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CITY}/:id`, 'read', 'Untuk melihat detail data kota')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update a city' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CITY}/:id`, 'update', 'Untuk memperbarui kota')
  update(@Param('id') id: string, @Body() payload: UpdateCityDto) {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Update a city' })
  @ApiBearerAuth()
  @Oacl(`${PATH.CITY}/:id`, 'delete', 'Untuk menghapus kota')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

import { Controller, Param, Query } from '@nestjs/common';
import { DonorService } from './donor.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';
import { ListDonorDto } from './dto/list-donor.dto';

@ApiTags('Donor')
@Controller({ path: PATH.DONOR, version: '1' })
export class DonorController {
  constructor(private readonly service: DonorService) {}

  @ApiOperation({ summary: 'Get all donor' })
  @ApiBearerAuth()
  @Oacl(PATH.DONOR, 'read', 'Melihat semua data donor')
  findAll(@Query() query: ListDonorDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one donor' })
  @ApiBearerAuth()
  @Oacl(`${PATH.DONOR}/:id`, 'read', 'Melihat satu data donor')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}

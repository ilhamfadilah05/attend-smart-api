import {
  Body,
  Controller,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { SedekahService } from './sedekah.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/libs/helper/common.helper';
import { UpdateSedekahDto } from './dto/sedekah-dto';

@ApiTags('Sedekah')
@Controller({ path: PATH.SEDEKAH, version: '1' })
export class SedekahController {
  constructor(private readonly service: SedekahService) {}

  @ApiOperation({ summary: 'Get sedekah' })
  @ApiBearerAuth()
  @Oacl(PATH.SEDEKAH, 'read', 'Untuk melihat sedekah')
  findOne() {
    return this.service.findSedekah();
  }

  @ApiOperation({ summary: 'Update sedekah' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Oacl(PATH.SEDEKAH, 'update', 'Untuk memperbarui sedekah')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  update(
    @Body() paylaod: UpdateSedekahDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.update(paylaod, image);
  }
}

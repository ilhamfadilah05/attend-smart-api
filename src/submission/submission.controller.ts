import {
  Controller,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { PATH } from 'src/libs/constant';
import { ListSubmissionDto } from './dto/list-submission.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';
import { multerOptions } from 'src/libs/helper/common.helper';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Submission')
@Controller({ path: PATH.SUBMISSION, version: '1' })
export class SubmissionController {
  constructor(private readonly service: SubmissionService) {}

  @ApiOperation({ summary: 'Create submission' })
  @ApiBearerAuth()
  @Oacl(PATH.SUBMISSION, 'create', 'Untuk melihat data submission')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  create(
    @Body() payload: CreateSubmissionDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.create(payload, image);
  }

  @ApiOperation({ summary: 'Get all submission' })
  @ApiBearerAuth()
  @Oacl(PATH.SUBMISSION, 'read', 'Untuk melihat data submission')
  findAll(@Query() query: ListSubmissionDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @ApiBearerAuth()
  @Oacl(`${PATH.SUBMISSION}/:id`, 'read', 'Untuk memperbarui submission')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update submission' })
  @ApiBearerAuth()
  @Oacl(`${PATH.SUBMISSION}/:id`, 'update', 'Untuk memperbarui submission')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  update(
    @Param('id', UUIDPipe) id: string,
    @Body() payload: UpdateSubmissionDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.update(id, payload, image);
  }

  @ApiOperation({ summary: 'Delete submission' })
  @ApiBearerAuth()
  @Oacl(`${PATH.SUBMISSION}/:id`, 'delete', 'Untuk menghapus submission')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

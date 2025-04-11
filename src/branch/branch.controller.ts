import { Controller, Body, Param, Query } from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { PATH } from 'src/libs/constant';
import { ListBranchDto } from './dto/list-branch.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('Branch')
@Controller({ path: PATH.BRANCH, version: '1' })
export class BranchController {
  constructor(private readonly service: BranchService) {}

  @ApiOperation({ summary: 'Create branch' })
  @ApiBearerAuth()
  @Oacl(PATH.BRANCH, 'create', 'Untuk melihat data branch')
  create(@Body() payload: CreateBranchDto) {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Get all branch' })
  @ApiBearerAuth()
  @Oacl(PATH.BRANCH, 'read', 'Untuk melihat data branch')
  findAll(@Query() query: ListBranchDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @ApiBearerAuth()
  @Oacl(`${PATH.BRANCH}/:id`, 'read', 'Untuk memperbarui branch')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update branch' })
  @ApiBearerAuth()
  @Oacl(`${PATH.BRANCH}/:id`, 'update', 'Untuk memperbarui branch')
  update(@Param('id', UUIDPipe) id: string, @Body() payload: UpdateBranchDto) {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete branch' })
  @ApiBearerAuth()
  @Oacl(`${PATH.BRANCH}/:id`, 'delete', 'Untuk menghapus branch')
  remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

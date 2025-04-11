import { Controller, Body, Param, Query, Get, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiOperation, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { ListRoleDto } from './dto/list-role.dto';
import { AuthGuard } from 'src/libs/guard/auth.guard';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('Role')
@Controller({ path: PATH.ROLE, version: '1' })
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get('permission-list')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async findAllPermissionList() {
    return this.service.getPermissions();
  }

  @ApiOperation({ summary: 'Create a new role' })
  @ApiBearerAuth()
  @Oacl(PATH.ROLE, 'create', 'Untuk membuat role')
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.service.create(createRoleDto);
  }

  @ApiOperation({ summary: 'Get all roles' })
  @ApiBearerAuth()
  @Oacl(PATH.ROLE, 'read', 'Untuk melihat data role')
  async findAll(@Query() query: ListRoleDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one role' })
  @ApiBearerAuth()
  @Oacl(`${PATH.ROLE}/:id`, 'read', 'Untuk melihat detail role')
  async findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update role' })
  @ApiBearerAuth()
  @Oacl(`${PATH.ROLE}/:id`, 'update', 'Untuk memperbarui role')
  async update(
    @Param('id', UUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.service.update(id, updateRoleDto);
  }

  @ApiOperation({ summary: 'Delete role' })
  @ApiBearerAuth()
  @Oacl(`${PATH.ROLE}/:id`, 'delete', 'Untuk menghapus role')
  async remove(@Param('id', UUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

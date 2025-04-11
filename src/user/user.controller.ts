import { Controller, Body, Param, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PATH } from 'src/libs/constant';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { ListUserDto } from './dto/list-user.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';
import { Features } from 'src/libs/decorator/feature.decorator';
import { AccessDto } from 'src/role/dto/create-role.dto';

@ApiTags('User')
@Controller({ path: PATH.USER, version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Create a user' })
  @ApiBearerAuth()
  @Oacl(PATH.USER, 'create', 'Untuk membuat user baru')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Get all users' })
  @ApiBearerAuth()
  @Oacl(PATH.USER, 'read', 'Untuk melihat data user')
  async findAll(@Query() query: ListUserDto) {
    return this.userService.findAll(query);
  }

  @ApiOperation({ summary: 'Get one user' })
  @ApiBearerAuth()
  @Oacl(`${PATH.USER}/:id`, 'read', 'Untuk melihat detail user')
  async findOne(@Param('id', UUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiBearerAuth()
  @Oacl(`${PATH.USER}/:id`, 'update', 'Untuk memperbarui user')
  async update(
    @Param('id', UUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Features() features: AccessDto[],
  ) {
    return this.userService.update(id, updateUserDto, features);
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiBearerAuth()
  @Oacl(`${PATH.USER}/:id`, 'delete', 'Untuk memperbarui user')
  async remove(@Param('id', UUIDPipe) id: string) {
    return this.userService.remove(id);
  }
}

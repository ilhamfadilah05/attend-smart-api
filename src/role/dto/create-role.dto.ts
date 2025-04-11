import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ActionEnum } from 'src/libs/constant';
import { PermissionRole } from 'src/libs/interface';

export class AccessDto {
  @IsString()
  @IsEnum(ActionEnum, {
    message: `action should be one of: ${Object.keys(ActionEnum).join(', ')}`,
  })
  @ApiProperty()
  action: string;

  @IsString()
  @ApiProperty()
  subject: string;
}

export class CreateRoleDto {
  @ApiProperty({ description: 'The name of the role' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AccessDto)
  @ApiProperty({
    description:
      'example payload : "[{ action: "read", subject: "role"}, { action: "create", subject: "role"}]"',
    example: [
      { action: 'read', subject: 'roles' },
      { action: 'create', subject: 'roles' },
    ],
  })
  permissions: PermissionRole[];
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsDateString,
  IsUUID,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { USER_STATUS } from 'src/libs/entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  email: string;

  @IsEnum(USER_STATUS, {
    message: `Type must be one of the following: ${Object.values(USER_STATUS).join(', ')}`,
  })
  @IsOptional()
  @ApiProperty({})
  status: USER_STATUS;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  password: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  nik: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  is_admin: boolean;

  @MaxLength(15)
  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  phone: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsUUID()
  role_id: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @Transform(({ value }) => (!value ? null : value))
  @IsDateString()
  start_date: Date | string;

  @IsOptional()
  @ApiProperty({ required: false })
  @Transform(({ value }) => (!value ? null : value))
  @IsDateString()
  end_date: Date | string;
}

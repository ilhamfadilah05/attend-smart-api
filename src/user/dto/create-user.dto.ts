import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsDateString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  email: string;

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

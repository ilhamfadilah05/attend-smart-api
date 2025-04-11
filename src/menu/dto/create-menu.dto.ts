import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { MENU_TYPE } from 'src/libs/constant';

export class CreateMenuDto {
  @ApiProperty({ description: 'Name of menu' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Type of menu',
    enum: MENU_TYPE,
  })
  @IsEnum(MENU_TYPE, {
    message: `Type must be one of the following: ${Object.values(MENU_TYPE).join(', ')}`,
  })
  @IsNotEmpty()
  type: MENU_TYPE;

  @ApiProperty({ description: 'Value of menu' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: 'Tag of menu' })
  @IsString()
  tag: string;

  @ApiProperty({ description: 'Position order of menu' })
  @Transform(({ value }) =>
    value === '' || value === 'null' ? undefined : Number(value),
  )
  @IsNumber()
  @IsOptional()
  position_order: number;

  @ApiProperty({ description: 'Publish status of banner' })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsNotEmpty()
  is_publish: boolean;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Menu image',
  })
  image: Express.Multer.File;
}

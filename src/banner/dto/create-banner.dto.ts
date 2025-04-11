import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { BANNER_TYPE } from 'src/libs/constant';

export class CreateBannerDto {
  @ApiProperty({
    description: 'Type of banner',
    enumName: 'BANNER_TYPE',
    enum: BANNER_TYPE,
    example: BANNER_TYPE.CAMPAIGN,
  })
  @IsEnum(BANNER_TYPE, {
    message: `Type must be one of the following: ${Object.values(BANNER_TYPE).join(', ')}`,
  })
  @IsNotEmpty()
  type: BANNER_TYPE;

  @ApiProperty({ description: 'Value of banner' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ description: 'Publish status of banner' })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsNotEmpty()
  is_publish: boolean;

  @ApiProperty({ description: 'Position order of banner' })
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNumber()
  @IsNotEmpty()
  position_order: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Banner image',
  })
  image: Express.Multer.File;
}

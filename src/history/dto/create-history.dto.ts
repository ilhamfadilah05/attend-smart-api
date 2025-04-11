import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { HISTORY_TYPE } from 'src/libs/constant';

export class CreateHistoryDto {
  @ApiProperty({ description: 'The name of the history' })
  @IsUUID()
  @IsNotEmpty()
  id_employee: string;

  @ApiProperty({ description: 'The name of the history' })
  @IsUUID()
  @IsOptional()
  id_submission: string;

  @ApiProperty({ description: 'The name of the history' })
  @IsString()
  @IsNotEmpty()
  lat_long: string;

  @ApiProperty({ description: 'The name of the history' })
  @IsDateString()
  @IsNotEmpty()
  date_attend: Date;

  @ApiPropertyOptional({ description: 'The name of the history' })
  @IsNumber()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsOptional()
  delayed: number;

  @ApiProperty({
    enum: HISTORY_TYPE,
    enumName: 'HISTORY_TYPE',
    description: `Shoukd be one of : ${Object.values(HISTORY_TYPE).join(', ')}`,
  })
  @IsEnum(HISTORY_TYPE, {
    message: `action should be one of: ${Object.values(HISTORY_TYPE).join(', ')}`,
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'The name of the history' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Campaign image',
  })
  image: Express.Multer.File;
}

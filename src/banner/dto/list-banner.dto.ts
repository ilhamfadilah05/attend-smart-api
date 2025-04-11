import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsISO8601,
  IsNumber,
} from 'class-validator';
import { BANNER_TYPE } from 'src/libs/constant';

export class ListBannerDto {
  @ApiPropertyOptional({
    description: 'Type of banner',
    enumName: 'BANNER_TYPE',
    enum: BANNER_TYPE,
    example: BANNER_TYPE.CAMPAIGN,
  })
  @IsEnum(BANNER_TYPE, {
    message: `Type must be one of the following: ${Object.values(BANNER_TYPE).join(', ')}`,
  })
  @IsOptional()
  type: BANNER_TYPE;

  @ApiPropertyOptional({
    description: 'Value of banner',
  })
  @IsOptional()
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Publish status of banner' })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  is_publish: boolean;

  @ApiPropertyOptional({ description: 'Position order of banner' })
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNumber()
  @IsOptional()
  position_order: number;

  @ApiPropertyOptional({
    description: 'page number | default 1',
  })
  @IsNumberString()
  @IsOptional()
  page: number;

  @ApiPropertyOptional({
    description: 'data per page | default : 10',
  })
  @IsNumberString()
  @IsOptional()
  limit: number;

  @ApiPropertyOptional({
    description: 'keyword: asc & desc | column : key, value',
  })
  @IsOptional()
  @IsString()
  sort_by: string;

  @ApiPropertyOptional({
    type: String,
    example: '2025-03-15',
    description: 'Valid ISO 8601 date',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Invalid date format. Expected value YYYY-MM-DD' })
  created_at_gte: string;

  @ApiPropertyOptional({
    type: String,
    example: '2025-03-15',
    description: 'Valid ISO 8601 date',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Invalid date format. Expected value YYYY-MM-DD' })
  created_at_lte: string;
}

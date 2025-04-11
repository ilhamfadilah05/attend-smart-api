import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsNumber,
  IsISO8601,
} from 'class-validator';
import { MENU_TYPE } from 'src/libs/constant';

export class ListMenuDto {
  @ApiPropertyOptional({ description: 'Name of menu' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({
    description: 'Type of menu',
    enum: MENU_TYPE,
  })
  @IsEnum(MENU_TYPE, {
    message: `Type must be one of the following: ${Object.values(MENU_TYPE).join(', ')}`,
  })
  @IsOptional()
  type: MENU_TYPE;

  @ApiPropertyOptional({ description: 'Tag of menu' })
  @IsString()
  @IsOptional()
  tag: string;

  @ApiPropertyOptional({ description: 'Position order of menu' })
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNumber()
  @IsOptional()
  position_order: number;

  @ApiPropertyOptional({ description: 'Publish status of banner' })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  is_publish: boolean;

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
  @IsString()
  @IsOptional()
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

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class ListZakatDto {
  @ApiPropertyOptional({
    description: 'Search by campaign name',
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({
    description: 'Search by slug',
  })
  @IsString()
  @IsOptional()
  slug: string;

  @ApiPropertyOptional({ description: 'Filter by publish : true or false' })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  publish: boolean;

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
    description:
      'sort data | default : date-asc | choices : date-asc, date-desc, name-asc, name-desc',
  })
  @IsOptional()
  @IsString()
  sort_by: string;
}

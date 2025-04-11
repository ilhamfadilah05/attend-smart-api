import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class ListUserActivityDto {
  @ApiPropertyOptional({
    description: 'Search by user name',
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({
    description: 'Search by email',
  })
  @IsString()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({
    description: 'Search by model',
  })
  @IsString()
  @IsOptional()
  model: string;

  @ApiPropertyOptional({
    description: 'Search by action',
  })
  @IsString()
  @IsOptional()
  action: string;

  @ApiPropertyOptional({
    description: 'Search by ip',
  })
  @IsString()
  @IsOptional()
  ip: string;

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
      'keyword: asc & desc | column : date, name, description, & slug',
  })
  @IsOptional()
  @IsString()
  sort_by: string;

  @ApiPropertyOptional({
    type: String,
    example: '2025-03-06',
    description: 'A valid ISO 8601 date',
  })
  @IsISO8601({}, { message: 'Invalid date format. Expected YYYY-MM-DD' })
  @IsOptional()
  created_at_gte: string[];

  @ApiPropertyOptional({
    type: String,
    example: '2025-03-06',
    description: 'A valid ISO 8601 date',
  })
  @IsISO8601({}, { message: 'Invalid date format. Expected YYYY-MM-DD' })
  @IsOptional()
  created_at_lte: string[];
}

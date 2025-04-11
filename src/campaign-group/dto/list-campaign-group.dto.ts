import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class ListCampaignGroupDto {
  @ApiPropertyOptional({
    description: 'Search by name',
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
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class ListCampaignNewsDto {
  @ApiPropertyOptional({
    description: 'Search by campaign news title',
  })
  @IsString()
  @IsOptional()
  title: string;

  @ApiPropertyOptional({
    description: 'Search by campaign id',
  })
  @IsString()
  @IsOptional()
  campaign_id: string;

  @ApiPropertyOptional({
    description: 'Search by campaign news description',
  })
  @IsString()
  @IsOptional()
  description: string;

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

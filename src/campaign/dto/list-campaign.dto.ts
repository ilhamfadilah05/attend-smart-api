import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { CAMPAIGN_TYPE } from './create-campaign.dto';

export class ListCampaignDto {
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

  @ApiPropertyOptional({
    description: 'Search by type',
  })
  @IsEnum(CAMPAIGN_TYPE, {
    message: `Type must be one of the following: ${Object.values(CAMPAIGN_TYPE).join(', ')}`,
  })
  @IsOptional()
  type: string;

  @ApiPropertyOptional({ description: 'Filter by publish : true or false' })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  publish: boolean;

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
    type: String,
    description: 'Number string',
  })
  @IsNumberString()
  @IsOptional()
  campaign_target_gte: string[];

  @ApiPropertyOptional({
    type: String,
    description: 'Number string',
  })
  @IsNumberString()
  @IsOptional()
  campaign_target_lte: string[];

  @ApiPropertyOptional({
    type: String,
    description: 'Number string',
  })
  @IsNumberString()
  @IsOptional()
  current_funds_gte: string[];

  @ApiPropertyOptional({
    type: String,
    description: 'Number string',
  })
  @IsNumberString()
  @IsOptional()
  current_funds_lte: string[];

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

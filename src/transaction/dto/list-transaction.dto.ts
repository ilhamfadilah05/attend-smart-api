import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { FUND_TYPE, TRANSACTION_TYPE } from 'src/libs/constant';

export class ListTransactionDto {
  @ApiPropertyOptional({
    description: 'Search by HID',
  })
  @IsString()
  @IsOptional()
  hid: string;

  @ApiPropertyOptional({
    description: 'Search by name',
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({
    description: 'Search by phone',
  })
  @IsString()
  @IsOptional()
  phone: string;

  @ApiPropertyOptional({
    description: 'Search by email',
  })
  @IsString()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Number string',
  })
  @IsNumberString()
  @IsOptional()
  amount_gte: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Number string',
  })
  @IsNumberString()
  @IsOptional()
  amount_lte: string;

  @ApiPropertyOptional({
    description: 'Search by campaign type',
  })
  @IsEnum(TRANSACTION_TYPE, {
    message: `Type must be one of the following: ${Object.values(TRANSACTION_TYPE).join(', ')}`,
  })
  @IsOptional()
  status: string;

  @ApiPropertyOptional({
    description: 'Search by campaign type',
  })
  @IsEnum(FUND_TYPE, {
    message: `Type must be one of the following: ${Object.values(FUND_TYPE).join(', ')}`,
  })
  @IsOptional()
  campaign_type: string;

  @ApiPropertyOptional({
    description: 'Search by campaign name',
  })
  @IsString()
  @IsOptional()
  campaign_name: string;

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

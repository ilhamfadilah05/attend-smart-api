import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { HISTORY_TYPE } from 'src/libs/constant';

export class ListHistoryDto {
  @ApiPropertyOptional({
    description: 'Search by employee',
  })
  @IsString()
  @IsOptional()
  id_employee: string;

  @ApiPropertyOptional({
    description: 'Search by department',
  })
  @IsString()
  @IsOptional()
  id_department: string;

  @ApiPropertyOptional({
    description: 'Search by branch',
  })
  @IsString()
  @IsOptional()
  id_branch: string;

  @ApiPropertyOptional({
    description: 'Type of history',
    enumName: 'HISTORY_TYPE',
    enum: HISTORY_TYPE,
    example: HISTORY_TYPE.ATTEND_IN,
  })
  @IsEnum(HISTORY_TYPE, {
    message: `Type must be one of the following: ${Object.values(HISTORY_TYPE).join(', ')}`,
  })
  @IsOptional()
  type: HISTORY_TYPE;

  @ApiPropertyOptional({
    type: String,
    example: '2025-03-15',
    description: 'Valid ISO 8601 date',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Invalid date format. Expected value YYYY-MM-DD' })
  date_attend_gte: string;

  @ApiPropertyOptional({
    type: String,
    example: '2025-03-15',
    description: 'Valid ISO 8601 date',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Invalid date format. Expected value YYYY-MM-DD' })
  date_attend_lte: string;

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

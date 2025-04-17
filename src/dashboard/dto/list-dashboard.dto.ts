import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ListDashboardDto {
  @ApiProperty({
    description: 'Search by employee',
  })
  @IsString()
  @IsNotEmpty()
  id_employee: string;

  @ApiProperty({
    type: String,
    example: '2025-03-15',
    description: 'Valid ISO 8601 date',
  })
  @IsNotEmpty()
  @IsISO8601({}, { message: 'Invalid date format. Expected value YYYY-MM-DD' })
  date_attend_gte: string;

  @ApiProperty({
    type: String,
    example: '2025-03-15',
    description: 'Valid ISO 8601 date',
  })
  @IsNotEmpty()
  @IsISO8601({}, { message: 'Invalid date format. Expected value YYYY-MM-DD' })
  date_attend_lte: string;
}

export class DashboardStatisticDto {
  @ApiProperty({
    description: 'Search by employee',
  })
  @IsString()
  @IsNotEmpty()
  type: string;
}

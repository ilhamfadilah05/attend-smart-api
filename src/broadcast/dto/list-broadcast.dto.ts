import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class ListBroadcastDto {
  @ApiPropertyOptional({
    description: 'Search by title',
  })
  @IsString()
  @IsOptional()
  title: string;

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

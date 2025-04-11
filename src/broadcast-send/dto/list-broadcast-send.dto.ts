import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class ListBroadcastSendDto {
  @ApiPropertyOptional({
    description: 'Search by employee',
  })
  @IsString()
  @IsOptional()
  id_employee: string;

  @ApiPropertyOptional({
    description: 'Search by broadcast',
  })
  @IsString()
  @IsOptional()
  id_broadcast: string;

  @ApiPropertyOptional({
    description: 'Search by name',
  })
  @IsString()
  @IsOptional()
  name: string;

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

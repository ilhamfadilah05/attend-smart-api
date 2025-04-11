import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListSandraProjectDto {
  @ApiPropertyOptional({
    description: 'Search by name',
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({
    description: 'Find by sandra program uuid',
  })
  @IsString()
  @IsOptional()
  sandra_program_uuid: string;
}

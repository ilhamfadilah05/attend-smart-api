import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class UpdateSedekahDto {
  @ApiPropertyOptional({ description: 'Name of Sedekah' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ description: 'Slug of Sedekah' })
  @IsString()
  @IsOptional()
  slug: string;

  @ApiPropertyOptional({ description: 'Description of Sedekah' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Sedekah image',
  })
  image: Express.Multer.File;

  @ApiPropertyOptional({ description: 'Publish Sedekah' })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  is_publish: boolean;

  @ApiPropertyOptional({ description: 'Sandra program id' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  @IsOptional()
  sandra_program_uuid: string;

  @ApiPropertyOptional({ description: 'Sandra project id' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  @IsOptional()
  sandra_project_uuid: string;
}

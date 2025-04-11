import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: 'The name of the branch' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'The is default of the branch' })
  @IsBoolean()
  @IsOptional()
  is_default: boolean;

  @ApiProperty({ description: 'The radius of the branch' })
  @IsNumber()
  @IsOptional()
  radius: number;

  @ApiProperty({ description: 'The latitude and longitude of the branch' })
  @IsString()
  @IsOptional()
  lat_long: string;

  @ApiProperty({ description: 'The tolerance of the branch' })
  @IsNumber()
  @IsOptional()
  tolerance: number;

  @ApiProperty({ description: 'The work start time of the branch' })
  @IsString()
  @IsNotEmpty()
  work_start_time: string;

  @ApiProperty({ description: 'The work end time of the branch' })
  @IsString()
  @IsNotEmpty()
  work_end_time: string;
}

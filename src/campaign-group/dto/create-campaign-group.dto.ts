import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCampaignGroupDto {
  @ApiProperty({ description: 'The name of the campaign group' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The description of the campaign group' })
  @IsOptional()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'The slug of the campaign group' })
  @IsString()
  @IsNotEmpty()
  slug: string;
}

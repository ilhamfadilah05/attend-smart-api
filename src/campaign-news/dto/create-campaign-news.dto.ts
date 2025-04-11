import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCampaignNewsDto {
  @ApiProperty({ description: 'Title of campaign news' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description of campaign news' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'campaign id of campaign news' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  @IsNotEmpty()
  campaign_id: string;
}

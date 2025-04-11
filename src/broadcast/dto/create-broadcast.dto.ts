import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBroadcastDto {
  @ApiProperty({ description: 'The name of the broadcast' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'The name of the broadcast' })
  @IsString()
  @IsOptional()
  body: string;

  @ApiProperty({ description: 'The name of the broadcast' })
  @IsString()
  @IsOptional()
  image: string;
}

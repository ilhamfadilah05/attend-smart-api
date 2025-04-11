import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ description: 'The name of the city' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Province id' })
  @IsNumber()
  @IsNotEmpty()
  province_id: number;
}

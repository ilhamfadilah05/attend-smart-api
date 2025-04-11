import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateConfigDto {
  @ApiProperty({ description: 'Key of config' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Value of config' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

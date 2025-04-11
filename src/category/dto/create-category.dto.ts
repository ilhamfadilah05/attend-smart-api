import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { CATEGORY_TYPE } from 'src/libs/constant';

export class CreateCategoryDto {
  @ApiProperty({ description: 'The name of the category' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The type of the category' })
  @IsNotEmpty()
  @IsEnum(CATEGORY_TYPE)
  type: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'The name of the department' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

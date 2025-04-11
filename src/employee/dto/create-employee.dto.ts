import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'The name of the employee' })
  @IsUUID()
  @IsNotEmpty()
  id_user: string;

  @ApiProperty({ description: 'The name of the employee' })
  @IsUUID()
  @IsNotEmpty()
  id_department: string;

  @ApiProperty({ description: 'The name of the employee' })
  @IsUUID()
  @IsNotEmpty()
  id_branch: string;

  @ApiProperty({ description: 'The name of the employee' })
  @IsUUID()
  @IsOptional()
  id_salary: string;

  @ApiProperty({ description: 'The name of the employee' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The name of the employee' })
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty({ description: 'The name of the employee' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ description: 'The name of the employee' })
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Campaign image',
  })
  image: Express.Multer.File;
}

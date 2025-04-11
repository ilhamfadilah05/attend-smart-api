import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber } from 'class-validator';

export class CreateSalaryDto {
  @ApiProperty({ description: 'The name of the salary' })
  @IsUUID()
  @IsNotEmpty()
  id_employee: string;

  @ApiProperty({ description: 'The base salary of the salary' })
  @IsNumber()
  @IsNotEmpty()
  base_salary: number;

  @ApiProperty({ description: 'The base salary of the salary' })
  @IsNumber()
  @IsNotEmpty()
  meal_allowance: number;

  @ApiProperty({ description: 'The base salary of the salary' })
  @IsNumber()
  @IsNotEmpty()
  health_allowance: number;

  @ApiProperty({ description: 'The base salary of the salary' })
  @IsNumber()
  @IsNotEmpty()
  bonus_amount: number;

  @ApiProperty({ description: 'The base salary of the salary' })
  @IsNumber()
  @IsNotEmpty()
  absence_deduction_amount: number;

  @ApiProperty({ description: 'The base salary of the salary' })
  @IsNumber()
  @IsNotEmpty()
  overtime_amount: number;
}

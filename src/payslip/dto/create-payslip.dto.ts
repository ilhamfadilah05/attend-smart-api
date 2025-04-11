import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreatePayslipDto {
  @ApiProperty({ description: 'The name of the payslip' })
  @IsString()
  @IsNotEmpty()
  id_employee: string;

  @ApiProperty({ description: 'The name of the payslip' })
  @IsString()
  @IsNotEmpty()
  id_salary: string;

  @ApiProperty({ description: 'The name of the payslip' })
  @IsNumber()
  @IsNotEmpty()
  absence_days: number;

  @ApiProperty({ description: 'The name of the payslip' })
  @IsNumber()
  @IsNotEmpty()
  attendance_days: number;

  @ApiProperty({ description: 'The name of the payslip' })
  @IsNumber()
  @IsNotEmpty()
  overtime_days: number;

  @ApiPropertyOptional({ description: 'The name of the payslip' })
  @IsDateString()
  payroll_month: Date;
}

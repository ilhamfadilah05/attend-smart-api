import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
} from 'class-validator';

export enum SUBMISSION_STATUS {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum SUBMISSION_TYPE {
  OVERTIME = 'LEMBUR',
  WFH = 'WFH',
  PERMISSION = 'IZIN',
  SICK = 'SAKIT',
}

export class CreateSubmissionDto {
  @ApiProperty({ description: 'The name of the submission' })
  @IsUUID()
  @IsNotEmpty()
  id_employee: string;

  @ApiProperty({
    enum: SUBMISSION_TYPE,
    enumName: 'SUBMISSION_TYPE',
    description: `Shoukd be one of : ${Object.values(SUBMISSION_TYPE).join(', ')}`,
  })
  @IsEnum(SUBMISSION_TYPE, {
    message: `action should be one of: ${Object.values(SUBMISSION_TYPE).join(', ')}`,
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    enum: SUBMISSION_STATUS,
    enumName: 'SUBMISSION_STATUS',
    description: `Shoukd be one of : ${Object.values(SUBMISSION_STATUS).join(', ')}`,
  })
  @IsEnum(SUBMISSION_STATUS, {
    message: `action should be one of: ${Object.values(SUBMISSION_STATUS).join(', ')}`,
  })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ description: 'The radius of the submission' })
  @IsString()
  @IsOptional()
  reason: string;

  @ApiProperty({ description: 'The work start time of the submission' })
  @IsDateString()
  @IsNotEmpty()
  start_date: Date;

  @ApiProperty({ description: 'The work end time of the submission' })
  @IsDateString()
  @IsNotEmpty()
  end_date: Date;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Campaign image',
  })
  image: Express.Multer.File;
}

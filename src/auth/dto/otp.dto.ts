import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ProcessOTPDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  otp: string;

  @IsOptional()
  user_agent?: string;
}

export class ResendOTPDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  email: string;
}

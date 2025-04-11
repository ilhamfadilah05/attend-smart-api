import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'The user email' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'The user password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginAppDto {
  @ApiProperty({ description: 'The user email' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'The user password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'The notification token firebase' })
  @IsString()
  @IsOptional()
  token_notif?: string;
}

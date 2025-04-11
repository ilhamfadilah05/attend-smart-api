import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  token: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  password: string;
}

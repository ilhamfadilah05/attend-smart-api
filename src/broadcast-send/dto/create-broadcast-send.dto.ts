import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsBoolean } from 'class-validator';

export class CreateBroadcastSendDto {
  @ApiProperty({ description: 'The name of the broadcastsend' })
  @IsUUID()
  @IsNotEmpty()
  id_broadcast: string;

  @ApiProperty({ description: 'The name of the broadcastsend' })
  @IsUUID()
  @IsNotEmpty()
  id_employee: string;

  @ApiProperty({ description: 'The radius of the broadcastsend' })
  @IsBoolean()
  @IsNotEmpty()
  is_read: boolean;
}

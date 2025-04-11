import { PartialType } from '@nestjs/swagger';
import { CreateBroadcastSendDto } from './create-broadcast-send.dto';

export class UpdateBroadcastSendDto extends PartialType(
  CreateBroadcastSendDto,
) {}

import { PartialType } from '@nestjs/swagger';
import { CreateCampaignGroupDto } from './create-campaign-group.dto';

export class UpdateCampaignGroupDto extends PartialType(
  CreateCampaignGroupDto,
) {}

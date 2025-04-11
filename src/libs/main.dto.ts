import { IsUUID } from 'class-validator';

export class UUIDdto {
  @IsUUID()
  id: string;
}

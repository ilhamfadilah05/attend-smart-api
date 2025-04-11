import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class UUIDPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): string {
    if (!isUUID(value)) {
      throw new BadRequestException(
        `Invalid UUID format for parameter: ${metadata.data}`,
      );
    }
    return value;
  }
}

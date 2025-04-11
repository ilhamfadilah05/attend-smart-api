import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class ErrorHelper {
  private readonly logger = new Logger('InternalServerError');

  handleError(error: any, context?: string) {
    if (error instanceof HttpException) {
      throw error;
    }
    this.logger.error(context);
    throw new InternalServerErrorException(error);
  }
}

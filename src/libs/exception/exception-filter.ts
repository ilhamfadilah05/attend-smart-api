import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { JsonWebTokenError } from '@nestjs/jwt';
import { ResponseBody } from '../interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const responseBody: ResponseBody = {
      statusCode: 500,
      message: 'Opps! unexpected error occured',
      error: 'Internal server error',
    };

    if (exception instanceof JsonWebTokenError) {
      responseBody.statusCode = HttpStatus.UNAUTHORIZED;
      responseBody.message = 'Invalid Token';
      responseBody.error = this.defineErrorStatus(responseBody.statusCode);
    } else if (
      exception instanceof HttpException &&
      !(exception instanceof InternalServerErrorException)
    ) {
      responseBody.message = exception.message;
      responseBody.statusCode = exception.getStatus();
      responseBody.error = this.defineErrorStatus(responseBody.statusCode);
    } else {
      Logger.error(
        'Look below report for discovering the error',
        'InternalError',
      );
      console.log(exception);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, responseBody.statusCode);
  }

  private defineErrorStatus(status: number): string {
    switch (status) {
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service Unvailable';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'Content Too Large';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'Gateway Timeout';
      default:
        return 'Internal Server Error';
    }
  }
}

import { Injectable } from '@nestjs/common';
import { IResponseFormat } from '../interface';
@Injectable()
export class FormatResponseHelper {
  formatResponse = <T>({
    success,
    statusCode,
    message,
    data,
    page,
    totalData,
    pageSize,
  }: IResponseFormat<T>) => {
    return {
      success,
      statusCode,
      message,
      data,
      page,
      totalData,
      pageSize,
    };
  };
}

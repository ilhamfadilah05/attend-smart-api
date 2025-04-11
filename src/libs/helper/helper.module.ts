import { Module } from '@nestjs/common';
import { ErrorHelper } from './error.helper';
import { FormatResponseHelper } from './response.helper';
import { QueryHelper } from './query.helper';

@Module({
  providers: [ErrorHelper, FormatResponseHelper, QueryHelper],
  exports: [ErrorHelper, FormatResponseHelper, QueryHelper],
})
export class HelperModule {}

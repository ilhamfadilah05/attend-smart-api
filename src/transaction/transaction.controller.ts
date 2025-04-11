import { Controller, Param, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Oacl } from 'src/libs/decorator/oacl.decorator';
import { PATH } from 'src/libs/constant';
import { ListTransactionDto } from './dto/list-transaction.dto';
import { UUIDPipe } from 'src/libs/pipe/uuid.pipe';

@ApiTags('Transaction')
@Controller({ path: PATH.TRANSACTION, version: '1' })
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @ApiOperation({ summary: 'Get all transaction' })
  @ApiBearerAuth()
  @Oacl(PATH.TRANSACTION, 'read', 'Melihat semua data transaction')
  findAll(@Query() query: ListTransactionDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get one transaction' })
  @ApiBearerAuth()
  @Oacl(`${PATH.TRANSACTION}/:id`, 'read', 'Melihat satu data transaction')
  findOne(@Param('id', UUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}

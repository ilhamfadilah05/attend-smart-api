import { Injectable } from '@nestjs/common';
import { ListTransactionDto } from './dto/list-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/libs/entities/transaction.entity';
import { Repository } from 'typeorm';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { handleFloat } from 'src/libs/helper/common.helper';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
    private readonly queryHelper: QueryHelper,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}

  async findAll(query: ListTransactionDto) {
    try {
      // Pagination
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      // Selected column
      const SELECTED_COLUMNS = [
        'transaction.id',
        'transaction.donor_name AS "name"',
        'transaction.phone AS "phone"',
        'transaction.email AS "email"',
        'transaction.hid AS "hid"',
        'transaction.status AS "status"',
        'transaction.created_at AS "createdAt"',
        'transaction.updated_at AS "updatedAt"',
        'item.amount AS "amount"',
        'campaign.type AS "campaignType"',
        'campaign.name AS "campaignName"',
      ];

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      if (query.hid) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(hid) LIKE $${paramIndex}`);
        searchParams.push(`%${query.hid.toLowerCase()}%`);
      }

      if (query.name) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(
          `LOWER(transaction.donor_name) LIKE $${paramIndex}`,
        );
        searchParams.push(`%${query.name.toLowerCase()}%`);
      }

      if (query.phone) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(phone) LIKE $${paramIndex}`);
        searchParams.push(`%${query.phone.toLowerCase()}%`);
      }

      if (query.email) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(email) LIKE $${paramIndex}`);
        searchParams.push(`%${query.email.toLowerCase()}%`);
      }

      if (query.amount_gte) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`item.amount >= $${paramIndex}`);
        searchParams.push(query.amount_gte);
      }

      if (query.amount_lte) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`item.amount <= $${paramIndex}`);
        searchParams.push(query.amount_lte);
      }

      if (query.status) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`transaction.status = $${paramIndex}`);
        searchParams.push(query.status);
      }

      if (query.created_at_gte) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`transaction.created_at >= $${paramIndex}`);
        searchParams.push(query.created_at_gte);
      }

      if (query.created_at_lte) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`transaction.created_at <= $${paramIndex}`);
        searchParams.push(query.created_at_lte);
      }

      if (query.campaign_type) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`campaign.type = $${paramIndex}`);
        searchParams.push(query.campaign_type);
      }

      if (query.campaign_name) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(campaign.name) LIKE $${paramIndex}`);
        searchParams.push(`%${query.campaign_name.toLowerCase()}%`);
      }

      // Add condition for soft-deleted records
      searchConditions.push('transaction.deleted_at IS NULL');
      searchConditions.push('item.deleted_at IS NULL');

      const searchCondition = `AND ${searchConditions.join(' AND ')}`;

      // sorting logic
      let sortClause = 'ORDER BY transaction.created_at DESC';
      if (query.sort_by) {
        const validSortColumns = [
          'hid',
          'name',
          'phone',
          'email',
          'amount',
          'status',
          'created_at',
          'campaign_type',
          'campaign_name',
        ];

        // split the sort params
        const [column, order] = query.sort_by.split('-');

        // validate
        if (validSortColumns.includes(column)) {
          const columnMapping = {
            name: 'transaction.donor_name',
            phone: 'transaction.phone',
            email: 'transaction.email',
            hid: 'transaction.hid',
            status: 'transaction.status',
            created_at: 'transaction.created_at',
            amount: 'item.amount',
            campaign_type: 'campaign.type',
            campaign_name: 'campaign.name',
          };

          const dbColumn = columnMapping[column];
          const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
          sortClause = `ORDER BY ${dbColumn} ${sortOrder} NULLS LAST`;
        }
      }

      // fetch transaction query & parameter
      const fetchTransactionsQuery = `
        SELECT ${SELECTED_COLUMNS.join(', ')}
        FROM transactions AS transaction
        LEFT JOIN transaction_items AS item ON transaction.id = item.transaction_id
        LEFT JOIN campaigns AS campaign ON item.campaign_id = campaign.id
        WHERE 1=1
        ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchTransactionsParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countTransactionsQuery = `
        SELECT COUNT(*) as count
        FROM transactions AS transaction
        LEFT JOIN transaction_items AS item ON transaction.id = item.transaction_id
        LEFT JOIN campaigns AS campaign ON item.campaign_id = campaign.id
        WHERE 1=1 ${searchCondition}
      `;
      const countTransactionsParams = searchParams;

      // Execute queries
      const [transactionItem, [totalTransactionItem]]: [
        any[],
        { count: number }[],
      ] = await Promise.all([
        this.repository.query(fetchTransactionsQuery, fetchTransactionsParams),
        this.repository.query(countTransactionsQuery, countTransactionsParams),
      ]);

      // Format response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get transaction success',
        data: transactionItem.map((transaction) => ({
          id: transaction.id,
          name: transaction.name,
          phone: transaction.phone,
          email: transaction.email,
          hid: transaction.hid,
          status: transaction.status,
          campaign_type: transaction.campaignType,
          campaign_name: transaction.campaignName,
          amount: transaction.amount,
          created_at: transaction.createdAt,
          updated_at: transaction.updatedAt,
        })),
        page,
        pageSize: limit,
        totalData: Number(totalTransactionItem.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${TransactionService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      // selected column
      const SELECTED_COLUMNS = [
        'transaction.id',
        'transaction.donor_name AS "name"',
        'transaction.phone AS "phone"',
        'transaction.email AS "email"',
        'transaction.hid AS "hid"',
        'transaction.status AS "status"',
        'transaction.created_at AS "createdAt"',
        'transaction.updated_at AS "updatedAt"',
        'item.amount AS "amount"',
        'campaign.type AS "campaignType"',
        'campaign.name AS "campaignName"',
      ];

      // Query to fetch a single transaction by ID
      const fetchTransactionQuery = `
        SELECT ${SELECTED_COLUMNS.join(', ')}
        FROM transactions AS transaction
        LEFT JOIN transaction_items AS item ON transaction.id = item.transaction_id
        LEFT JOIN campaigns AS campaign ON item.campaign_id = campaign.id
        WHERE transaction.id = $1
        AND transaction.deleted_at IS NULL
        AND item.deleted_at IS NULL
      `;

      // Execute the query
      const [transactionItem] = await this.repository.query(
        fetchTransactionQuery,
        [id],
      );

      // Check if the transaction exists
      if (!transactionItem || transactionItem.length === 0) {
        return this.res.formatResponse({
          success: false,
          statusCode: 404,
          message: 'Transaction not found',
          data: null,
        });
      }

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: transactionItem.id,
          name: transactionItem.name,
          phone: transactionItem.phone,
          email: transactionItem.email,
          hid: transactionItem.hid,
          status: transactionItem.status,
          campaign_type: transactionItem.campaignType,
          campaign_name: transactionItem.campaignName,
          amount: handleFloat(transactionItem.amount),
          created_at: transactionItem.createdAt,
          updated_at: transactionItem.updatedAt,
        },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${TransactionService.name}.${this.findOne.name}`,
      );
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Config } from 'src/libs/entities/config.entity';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { ListConfigDto } from './dto/list-config.dto';

@Injectable()
export class ConfigService {
  private static readonly DB_NAME = 'global_configs';
  private static readonly DB_COLUMNS = [
    'id',
    'key',
    'value',
    'created_at',
    'updated_at',
  ];

  constructor(
    @InjectRepository(Config)
    private readonly repository: Repository<Config>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}

  async create(payload: CreateConfigDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const config = new Config();

      config.key = payload.key;
      config.value = payload.value;

      await queryRunner.manager.save(config);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: config.id,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.error.handleError(error, Config.name);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListConfigDto) {
    try {
      // Pagination
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      if (query.key) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(value) LIKE $${paramIndex}`);
        searchParams.push(`%${query.key.toLowerCase()}%`);
      }

      if (query.value) {
        const paramIndex = searchParams.length + 1; // Calculate the next parameter index
        searchConditions.push(`LOWER(value) LIKE $${paramIndex}`);
        searchParams.push(`%${query.value.toLowerCase()}%`);
      }

      if (query.created_at_gte) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`created_at >= $${paramIndex}`);
        searchParams.push(query.created_at_gte);
      }

      if (query.created_at_lte) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`created_at <= $${paramIndex}`);
        searchParams.push(query.created_at_lte);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `AND ${searchConditions.join(' AND ')}`
          : '';

      // sorting logic
      let sortClause = 'ORDER BY created_at ASC';
      if (query.sort_by) {
        const validSortColumns = ['key', 'value'];

        // split the sort params
        const [column, order] = query.sort_by.split('-');

        // validate
        if (validSortColumns.includes(column)) {
          const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
          sortClause = `ORDER BY ${column} ${sortOrder}`;
        }
      }

      // Fetch configurations query and parameters
      const fetchConfigsQuery = `
        SELECT ${ConfigService.DB_COLUMNS.join(', ')} 
        FROM ${ConfigService.DB_NAME} 
        WHERE deleted_at IS NULL ${searchCondition}
        ${sortClause} 
        LIMIT $${searchParams.length + 1} 
        OFFSET $${searchParams.length + 2}
      `;
      const fetchConfigsParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countConfigsQuery = `
        SELECT COUNT(*) as count 
        FROM ${ConfigService.DB_NAME} 
        WHERE deleted_at IS NULL ${searchCondition}
      `;
      const countConfigsParams = searchParams;

      // Execute queries
      const [configs, [totalConfigs]]: [Config[], { count: number }[]] =
        await Promise.all([
          this.repository.query(fetchConfigsQuery, fetchConfigsParams),
          this.repository.query(countConfigsQuery, countConfigsParams),
        ]);

      // Format response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get config success',
        data: configs.map((config) => ({
          id: config.id,
          key: config.key,
          value: config.value,
          created_at: config.created_at,
          updated_at: config.updated_at,
        })),
        page: page,
        pageSize: limit,
        totalData: Number(totalConfigs.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${ConfigService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      // database queries
      const [config]: Config[] = await this.repository.query(
        `
        SELECT ${ConfigService.DB_COLUMNS.join(', ')}
        FROM ${ConfigService.DB_NAME}
        WHERE deleted_at IS NULL
        AND id = $1
        LIMIT 1
        `,
        [id],
      );

      if (!config) {
        throw new NotFoundException('Config not found');
      }

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: config.id,
          key: config.key,
          value: config.value,
          created_at: config.created_at,
          updated_at: config.updated_at,
        },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${ConfigService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(id: string, payload: UpdateConfigDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // check if config exist
      const config: Config = await queryRunner.manager.query(
        `
        SELECT id
        FROM ${ConfigService.DB_NAME}
        WHERE id = $1
        `,
        [id],
      );

      if (!config) {
        throw new NotFoundException('Config not found');
      }

      // update query dynamically
      const { updateQuery, params } = this.queryHelper.update<Partial<Config>>(
        id,
        {
          key: payload.key,
          value: payload.value,
        },
      );

      // execute query
      await queryRunner.manager.query(
        `
        UPDATE ${ConfigService.DB_NAME}
        SET ${updateQuery}
        WHERE id = $${params.length}
        RETURNING *
        `,
        params,
      );
      await queryRunner.commitTransaction();

      // return formatted response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id,
        },
      });
    } catch (error) {
      // rollback transaction in case of error
      await queryRunner.rollbackTransaction();

      // handle and log the error
      this.error.handleError(error, `${Config.name}.${this.findOne.name}`);
    } finally {
      // release query runner
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const params = [new Date(), id];

      const result: Config = await queryRunner.manager.query(
        `
        UPDATE ${ConfigService.DB_NAME}
        SET deleted_at = $1
        WHERE id = $2
        AND deleted_at IS NULL
        RETURNING *
        `,
        params,
      );

      if (!result) {
        throw new NotFoundException('Config not found');
      }

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete config success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.error.handleError(
        error,
        `${ConfigService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

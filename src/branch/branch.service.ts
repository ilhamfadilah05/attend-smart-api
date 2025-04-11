import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListBranchDto } from './dto/list-branch.dto';
import { Branch } from 'src/libs/entities/branch.entity';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly repository: Repository<Branch>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}

  async create(payload: CreateBranchDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const group = new Branch();
      group.name = payload.name;
      group.is_default = payload.is_default;
      group.radius = payload.radius;
      group.lat_long = payload.lat_long;
      group.tolerance = payload.tolerance;
      group.work_start_time = payload.work_start_time;
      group.work_end_time = payload.work_end_time;

      queryRunner.manager.save(group);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${this.create.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListBranchDto) {
    try {
      // Pagination
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      // Selected column
      const SELECTED_COLUMNS = [
        'b.id',
        'b.name',
        'b.is_default',
        'b.tolerance',
        'b.work_start_time',
        'b.work_end_time',
        'b.created_at',
      ];

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      // filter by name
      if (query.name !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(b.name) LIKE $${paramIndex}`);
        searchParams.push(`%${query.name.toLowerCase()}%`);
      }

      // filter by id employee
      if (query.id_employee !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`e.id = $${paramIndex}`);
        searchParams.push(query.id_employee);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `AND ${searchConditions.join(' AND ')}`
          : '';

      let sortClause = 'ORDER BY b.created_at ASC';

      // sorting logic
      if (query.sort_by) {
        const validSortColumns = ['b.created_at'];

        // split the sort params
        const [column, order] = query.sort_by.split('-');

        // validate
        if (validSortColumns.includes(column)) {
          const sortOrder = ['ASC', 'DESC'].includes(order.toUpperCase())
            ? order.toUpperCase()
            : 'ASC';
          sortClause = `ORDER BY ${column} ${sortOrder}`;
        }
      }

      // fetch transaction query & parameter
      const fetchDataQuery = `
        SELECT ${SELECTED_COLUMNS.join(', ')}
        FROM branches AS b
        LEFT JOIN employees e ON e.id_branch = b.id
        WHERE 1=1 ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchDataParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countDataQuery = `
        SELECT COUNT(*) as count
        FROM branches AS b
        LEFT JOIN employees e ON e.id_branch = b.id
        WHERE 1=1 ${searchCondition}
      `;
      const countDataParams = searchParams;

      // Execute queries
      const [dataItem, [totalItem]]: [any[], { count: number }[]] =
        await Promise.all([
          this.repository.query(fetchDataQuery, fetchDataParams),
          this.repository.query(countDataQuery, countDataParams),
        ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get branch success',
        data: dataItem,
        page: page,
        pageSize: limit,
        totalData: Number(totalItem.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${BranchService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      // Selected column
      const SELECTED_COLUMNS = [
        'id',
        'name',
        'radius',
        'tolerance',
        'is_default',
        'lat_long',
        'work_start_time',
        'work_end_time',
      ];

      // check branch
      const [data] = (await this.repository.query(
        `SELECT ${SELECTED_COLUMNS.join(', ')} FROM branches WHERE id = $1`,
        [id],
      )) as Branch[];

      // validation
      if (!data) throw new NotFoundException('Branch not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: data,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${BranchService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(id: string, payload: UpdateBranchDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // check branch
      const [data] = (await queryRunner.manager.query(
        'SELECT id FROM branches WHERE id = $1',
        [id],
      )) as Branch[];

      // validation
      if (!data) throw new NotFoundException('Branch not found');

      // add data to update
      const { updateQuery, params } = this.queryHelper.update<Partial<Branch>>(
        id,
        {
          name: payload.name,
          is_default: payload.is_default,
          radius: payload.radius,
          lat_long: payload.lat_long,
          tolerance: payload.tolerance,
          work_start_time: payload.work_start_time,
          work_end_time: payload.work_end_time,
        },
      );

      // query update
      const querySQL = `UPDATE branches SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      await queryRunner.manager.query(querySQL, params);
      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${Branch.name}.${this.findOne.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const querySQL = `TRUNCATE FROM branches WHERE id = $1 CASCADE`;
      const params = [id];

      const [[branch]]: [Branch[]] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      if (!branch) throw new NotFoundException('Branch not found');

      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete branch success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${BranchService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

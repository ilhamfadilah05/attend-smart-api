import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListDepartmentDto } from './dto/list-department.dto';
import { Department } from 'src/libs/entities/department.entity';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly repository: Repository<Department>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}
  async create(payload: CreateDepartmentDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const group = new Department();
      group.name = payload.name;

      queryRunner.manager.save(group);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: group.id,
          name: group.name,
          created_at: group.created_at,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${this.create.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListDepartmentDto) {
    try {
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      const SELECTED_COLUMNS = ['id', 'name', 'created_at'];

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      // filter by exact amount
      if (query.name !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(name) LIKE $${paramIndex}`);
        searchParams.push(`%${query.name.toLowerCase()}%`);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `deleted_at IS NULL AND ${searchConditions.join(' AND ')}`
          : 'deleted_at IS NULL';

      // sorting logic
      let sortClause = 'ORDER BY created_at ASC';
      if (query.sort_by) {
        const validSortColumns = ['created_at'];

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
        FROM departments
        WHERE ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchDataParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countDataQuery = `
        SELECT COUNT(*) as count
        FROM departments
        WHERE ${searchCondition}
      `;
      const countDataParams = searchParams;

      // Execute queries
      const [dataItem, [totaldataItem]]: [any[], { count: number }[]] =
        await Promise.all([
          this.repository.query(fetchDataQuery, fetchDataParams),
          this.repository.query(countDataQuery, countDataParams),
        ]);

      // Format response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get department success',
        data: dataItem,
        page,
        pageSize: limit,
        totalData: Number(totaldataItem.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${DepartmentService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const [Department] = (await this.repository.query(
        'SELECT * FROM departments WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as Department[];

      if (!Department) throw new NotFoundException('Department not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: Department.id,
          name: Department.name,
          created_at: Department.created_at,
          updated_at: Department.updated_at,
        },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${DepartmentService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(id: string, payload: UpdateDepartmentDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const [Department] = (await queryRunner.manager.query(
        'SELECT id FROM departments WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as Department[];
      if (!Department) throw new NotFoundException('Department not found');

      const { updateQuery, params } = this.queryHelper.update<
        Partial<Department>
      >(id, {
        name: payload.name,
      });

      const querySQL = `UPDATE departments SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      await queryRunner.manager.query(querySQL, params);
      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${Department.name}.${this.findOne.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const querySQL = `UPDATE departments SET deleted_at = NOW() WHERE id = $1 RETURNING *`;
      const params = [id];

      const [[department]]: [Department[]] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      if (!department) throw new NotFoundException('Department not found');

      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete department success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${DepartmentService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

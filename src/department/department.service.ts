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
      const filter = this.queryHelper.search(
        [
          {
            param: 'name',
            column: 'name',
            operator: 'ILIKE',
          },
        ],
        {
          queryString: query,
          params: [limit, offset],
        },
      );

      let orderBy = 'ORDER BY created_at DESC';

      if (query.sort_by) {
        const validSortColumns = ['name', 'created_at'];

        // Split the sort params
        const [column, order] = query.sort_by.split('-');

        // Validate
        if (validSortColumns.includes(column)) {
          const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
          orderBy = `ORDER BY ${column} ${sortOrder}`;
        }
      }

      const [departments, [totalDepartments]]: [
        Department[],
        { count: number }[],
      ] = await Promise.all([
        this.repository.query(
          `SELECT id, name, created_at, updated_at FROM departments  ${filter.where.q} ${orderBy} LIMIT $1 OFFSET $2`,
          filter.param.q,
        ),
        this.repository.query(
          `SELECT COUNT(*) as count FROM departments ${filter.where.c}`,
          filter.param.c,
        ),
      ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get department success',
        data: departments.map((cg) => ({
          id: cg.id,
          name: cg.name,
          created_at: cg.created_at,
          updated_at: cg.updated_at,
        })),
        page: page,
        pageSize: limit,
        totalData: Number(totalDepartments.count),
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
        'SELECT * FROM departments WHERE id = $1',
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
        'SELECT id FROM departments WHERE id = $1',
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
      const querySQL = `TRUNCATE FROM departments WHERE id = $1 CASCADE`;
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

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListSalaryDto } from './dto/list-salary.dto';
import { Salary } from 'src/libs/entities/salary.entity';
import { Employee } from 'src/libs/entities/employee.entity';
import { IUpdateSalary } from 'src/libs/interface';

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(Salary)
    private readonly repository: Repository<Salary>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}

  async create(payload: CreateSalaryDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // check id salary in table employees
      const [employee] = await this.repository.query(
        'SELECT id, id_salary FROM employees WHERE id = $1',
        [payload.id_employee],
      );
      if (employee['id_salary'])
        throw new ConflictException('Employee already exist!');

      // create group
      const group = new Salary();
      group.id_employee = { id: payload.id_employee } as Employee;
      group.base_salary = payload.base_salary;
      group.meal_allowance = payload.meal_allowance;
      group.health_allowance = payload.health_allowance;
      group.bonus_amount = payload.bonus_amount;
      group.absence_deduction_amount = payload.absence_deduction_amount;
      group.overtime_amount = payload.overtime_amount;

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

      const [group] = await this.repository.query(
        'SELECT * FROM salaries WHERE id_employee = $1',
        [payload.id_employee],
      );

      const queryUpdateSalary = `UPDATE employees SET id_salary = $1 WHERE id = $2`;
      await this.repository.query(queryUpdateSalary, [
        group.id,
        payload.id_employee,
      ]);
    }
  }

  async findAll(query: ListSalaryDto) {
    try {
      // Pagination
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      // Selected column
      const SELECTED_COLUMNS = [
        's.id',
        's.base_salary',
        's.meal_allowance',
        's.health_allowance',
        's.bonus_amount',
        's.created_at',
        'e.id as id_employee',
        'e.name as employee_name',
        'd.name as department_name',
      ];

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      // filter by exact amount
      if (query.name !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(e.name) LIKE $${paramIndex}`);
        searchParams.push(`%${query.name.toLowerCase()}%`);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `AND s.deleted_at IS NULL AND ${searchConditions.join(' AND ')}`
          : 's.deleted_at IS NULL';

      // sorting logic
      let sortClause = 'ORDER BY s.created_at ASC';
      if (query.sort_by) {
        const validSortColumns = ['s.created_at'];

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
      const fetchSalariesQuery = `
        SELECT ${SELECTED_COLUMNS.join(', ')}
        FROM salaries AS s
        LEFT JOIN employees AS e ON s.id_employee = e.id
        LEFT JOIN departments AS d ON e.id_department = d.id
        WHERE ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchSalariesParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countSalariesQuery = `
        SELECT COUNT(*) as count
        FROM salaries AS s
        LEFT JOIN employees AS e ON s.id_employee = e.id
        WHERE ${searchCondition}
      `;
      const countSalariesParams = searchParams;

      // Execute queries
      const [salaryItem, [totalsalaryItem]]: [any[], { count: number }[]] =
        await Promise.all([
          this.repository.query(fetchSalariesQuery, fetchSalariesParams),
          this.repository.query(countSalariesQuery, countSalariesParams),
        ]);

      // Format response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get salary success',
        data: salaryItem,
        page,
        pageSize: limit,
        totalData: Number(totalsalaryItem.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${SalaryService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const [salary] = (await this.repository.query(
        'SELECT * FROM salaries WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as Salary[];

      if (!salary) throw new NotFoundException('Salary not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: salary,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${SalaryService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(id: string, payload: UpdateSalaryDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // check salary
      const [salary] = (await queryRunner.manager.query(
        'SELECT id FROM salaries WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as Salary[];
      // validate
      if (!salary) throw new NotFoundException('Salary not found');

      // check employee
      const [employee] = (await queryRunner.manager.query(
        'SELECT id FROM employees WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as Salary[];
      // validate
      if (!employee) throw new NotFoundException('Employee not found');

      // set data
      const { updateQuery, params } = this.queryHelper.update<
        Partial<IUpdateSalary>
      >(id, {
        id_employee: payload.id_employee,
        base_salary: payload.base_salary,
        meal_allowance: payload.meal_allowance,
        health_allowance: payload.health_allowance,
        bonus_amount: payload.bonus_amount,
        absence_deduction_amount: payload.absence_deduction_amount,
        overtime_amount: payload.overtime_amount,
      });

      // query string
      const querySQL = `UPDATE salaries SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      await queryRunner.manager.query(querySQL, params);
      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${Salary.name}.${this.findOne.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const querySQL = `UPDATE salaries SET deleted_at = NOW() WHERE id = $1 RETURNING *`;
      const params = [id];

      const [[salaries]]: [Salary[]] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      if (!salaries) throw new NotFoundException('Salaries not found');

      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete salary success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${SalaryService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

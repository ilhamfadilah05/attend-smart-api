/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListEmployeeDto } from './dto/list-employee.dto';
import { Employee } from 'src/libs/entities/employee.entity';
import { User } from 'src/libs/entities/user.entity';
import { Department } from 'src/libs/entities/department.entity';
import { Branch } from 'src/libs/entities/branch.entity';
import { IUpdateEmployee } from 'src/libs/interface';
import { Salary } from 'src/libs/entities/salary.entity';
import { FirebaseStorageService } from 'src/libs/service/firebase/firebase-storage.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly repository: Repository<Employee>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
    private readonly fs: FirebaseStorageService,
  ) {}

  async create(payload: CreateEmployeeDto, image: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';
    try {
      // image is required
      if (!image) {
        throw new BadRequestException('Image is required');
      }

      // check user and validate
      const [user] = await queryRunner.manager.query(
        'SELECT id FROM users WHERE id = $1',
        [payload.id_user],
      );
      if (!user) {
        throw new BadRequestException('User not found!');
      }

      // check department and validate
      const [department] = await queryRunner.manager.query(
        'SELECT id FROM departments WHERE id = $1',
        [payload.id_department],
      );
      if (!department) {
        throw new BadRequestException('Department is not found');
      }

      // check branch and validate
      const [branch] = await queryRunner.manager.query(
        'SELECT id FROM branches WHERE id = $1',
        [payload.id_branch],
      );
      if (!branch) {
        throw new BadRequestException('Branch is not found');
      }

      // set image name
      imageName = 'employees/' + uuid() + '.' + image.mimetype.split('/')[1];

      // upload image
      const imageUrl = await this.fs.uploadFile({
        file: image,
        fileName: imageName,
      });

      // create employee
      const group = new Employee();
      group.name = payload.name;
      group.user = payload.id_user ? ({ id: payload.id_user } as User) : null;
      group.department = payload.id_department
        ? ({ id: payload.id_department } as Department)
        : null;
      group.branch = payload.id_branch
        ? ({ id: payload.id_branch } as Branch)
        : null;
      group.salary = payload.id_salary
        ? ({ id: payload.id_salary } as Salary)
        : null;
      group.phone = payload.phone;
      group.gender = payload.gender;
      group.address = payload.address;
      group.image = imageUrl;

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

      if (imageName.length > 0) {
        await this.fs.removeFile(imageName);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListEmployeeDto) {
    try {
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      const SELECTED_COLUMNS = [
        'e.id',
        'e.name',
        'e.image',
        'e.gender',
        'e.phone',
        'e.created_at',
        'e.updated_at',
        'u.name as user_name',
        'd.name as department_name',
        'b.name as branch_name',
        'u.email',
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
          ? `e.deleted_at IS NULL AND ${searchConditions.join(' AND ')}`
          : 'e.deleted_at IS NULL';

      // sorting logic
      let sortClause = 'ORDER BY e.created_at ASC';
      if (query.sort_by) {
        const validSortColumns = ['e.created_at'];

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
      const fetchDatasQuery = `
        SELECT ${SELECTED_COLUMNS.join(', ')}
        FROM employees e 
        LEFT JOIN users u ON u.id = e.id_user
        LEFT JOIN departments d ON d.id = e.id_department
        LEFT JOIN branches b ON b.id = e.id_branch
        WHERE ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchDatasParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countDatasQuery = `
        SELECT COUNT(*) as count
        FROM employees AS e
        WHERE ${searchCondition}
      `;
      const countDatasParams = searchParams;

      // Execute queries
      const [data, [totaldata]]: [any[], { count: number }[]] =
        await Promise.all([
          this.repository.query(fetchDatasQuery, fetchDatasParams),
          this.repository.query(countDatasQuery, countDatasParams),
        ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get employee success',
        data: data,
        page: page,
        pageSize: limit,
        totalData: Number(totaldata.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${EmployeeService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const SELECTED_COLUMNS = [
        'e.id',
        'e.name',
        'e.image',
        'e.gender',
        'e.phone',
        'e.address',
        'e.created_at',
        'e.updated_at',
        'u.name as user_name',
        'u.id as id_user',
        'd.name as department_name',
        'd.id as id_department',
        'b.name as branch_name',
        'b.work_start_time',
        'b.work_end_time',
        'b.radius',
        'b.lat_long',
        'b.tolerance',
        'b.id as id_branch',
        'u.email',
      ];

      const [employee] = (await this.repository.query(
        `SELECT ${SELECTED_COLUMNS.join(', ')}
         FROM employees e 
         LEFT JOIN users u ON u.id = e.id_user
         LEFT JOIN departments d ON d.id = e.id_department
         LEFT JOIN branches b ON b.id = e.id_branch
         WHERE e.id = $1 AND e.deleted_at IS NULL`,
        [id],
      )) as Employee[];

      if (!employee) throw new NotFoundException('Employee not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: employee,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${EmployeeService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(
    id: string,
    payload: UpdateEmployeeDto,
    image: Express.Multer.File,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';
    try {
      // check employee and validate
      const [employee] = await queryRunner.manager.query(
        'SELECT id, id_user, id_department, id_branch, image FROM employees WHERE id = $1 AND deleted_at IS NULL',
        [id],
      );
      if (!employee) throw new NotFoundException('Employee not found');

      // check department and validate
      const [department] = await queryRunner.manager.query(
        'SELECT id FROM departments WHERE id = $1 AND deleted_at IS NULL',
        [payload.id_department],
      );
      if (!department) throw new NotFoundException('Department not found');

      // check branch and validate
      const [branch] = await queryRunner.manager.query(
        'SELECT id FROM branches WHERE id = $1 AND deleted_at IS NULL',
        [payload.id_branch],
      );
      if (!branch) throw new NotFoundException('Branch not found');

      // check user and validate
      const [user] = await queryRunner.manager.query(
        'SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL',
        [payload.id_user],
      );
      if (!user) throw new NotFoundException('User not found');

      // check image
      if (image) {
        if (employee.image) {
          // delete before image
          await this.fs.removeFile(
            'employees/' +
              employee.image.split('/')[employee.image.split('/').length - 1],
          );
        }

        // upload new image
        imageName = 'employees/' + uuid() + '.' + image.mimetype.split('/')[1];

        // upload
        const imageUrl = await this.fs.uploadFile({
          file: image,
          fileName: imageName,
        });

        imageName = imageUrl;
      }

      const { updateQuery, params } = this.queryHelper.update<
        Partial<IUpdateEmployee>
      >(id, {
        id_user: payload.id_user,
        id_department: payload.id_department,
        id_branch: payload.id_branch,
        id_salary: payload.id_salary,
        name: payload.name,
        phone: payload.phone,
        gender: payload.gender,
        address: payload.address,
        image: imageName,
      });

      const querySQL = `UPDATE employees SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      await queryRunner.manager.query(querySQL, params);
      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${Employee.name}.${this.findOne.name}`);
      if (imageName.length > 0) {
        await this.fs.removeFile(imageName);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // // delete image
      // const [resultImage] = (await queryRunner.manager.query(
      //   'SELECT image FROM employees WHERE id = $1',
      //   [id],
      // )) as Employee[];

      // // check before image
      // if (resultImage.image) {
      //   // delete before image
      //   await this.fs.removeFile(
      //     'employees/' +
      //       resultImage.image.split('/')[
      //         resultImage.image.split('/').length - 1
      //       ],
      //   );
      // }

      const querySQL = `UPDATE employees SET deleted_at = NOW() WHERE id = $1 RETURNING *`;
      const params = [id];

      const [[employee]]: [Employee[]] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      if (!employee) throw new NotFoundException('Employee not found');

      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete employee success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${EmployeeService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

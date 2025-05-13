import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPassword } from 'src/libs/helper/common.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/libs/entities/user.entity';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { ListUserDto } from './dto/list-user.dto';
import { Role } from 'src/libs/entities/role.entity';
import { AccessDto } from 'src/role/dto/create-role.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}

  async create(payload: CreateUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const user = new User();
      user.role = new Role();
      user.email = payload.email;
      user.nik = payload.nik;
      user.name = payload.name;
      user.password = await hashPassword(payload.password);
      user.is_admin = payload.is_admin ?? true;
      user.role.id = payload.role_id;

      const newUser = await this.repository.save(user);
      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23505'
      ) {
        this.error.handleError(new ConflictException('Email already exist'));
      }
      this.error.handleError(error, `${UserService.name}.${this.create.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListUserDto) {
    try {
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      const SELECTED_COLUMNS = [
        'u.id',
        'u.name',
        'u.is_admin',
        'u.email',
        'u.created_at',
        'u.updated_at',
        'r.id as role_id',
        'r.name as role_name',
      ];

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      // filter by name
      if (query.name !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`u.name ILIKE $${paramIndex}`);
        searchParams.push(`%${query.name.toLowerCase()}%`);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `u.deleted_at IS NULL AND ${searchConditions.join(' AND ')}`
          : 'u.deleted_at IS NULL';

      let sortClause = 'ORDER BY u.created_at ASC';

      // sorting logic
      if (query.sort_by) {
        const validSortColumns = ['u.created_at'];

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
        FROM users AS u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchDataParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countDataQuery = `
        SELECT COUNT(*) as count
        FROM users AS u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE 1=1 AND ${searchCondition}
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
        message: 'Get users success',
        data: dataItem,
        page: page,
        pageSize: limit,
        totalData: Number(totalItem.count),
      });
    } catch (error) {
      this.error.handleError(error, `${UserService.name}.${this.findAll.name}`);
    }
  }

  async findOne(id: string) {
    try {
      const [user]: [any] = await this.repository.query(
        `SELECT u.id, u.name, u.is_admin, u.email, u.created_at, u.updated_at, u.nik, u.phone,
            json_build_object(
                'id', r.id,
                'name', r.name
            ) AS role 
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE u.id = $1 AND u.deleted_at IS NULL LIMIT 1`,
        [id],
      );

      if (!user) throw new NotFoundException('User not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get user success',
        data: {
          id: user.id,
          name: user.name,
          nik: user.nik,
          phone: user.phone,
          email: user.email,
          role: user.role,
          is_admin: user.is_admin,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      this.error.handleError(error, `${UserService.name}.${this.findOne.name}`);
    }
  }

  async update(id: string, payload: UpdateUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const updateData = {
        name: payload.name,
        nik: payload.nik,
        email: payload.email,
        phone: payload.phone,
        role_id: payload.role_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        is_admin: payload.is_admin,
        password: payload.password
          ? await hashPassword(payload.password)
          : null,
      };

      for (const data in updateData) {
        if (updateData[data] === null || updateData[data] === undefined) {
          delete updateData[data];
        }
      }

      const [user]: [User] = await this.repository.query(
        `SELECT u.id, u.name, u.email, u.created_at, u.updated_at, u.role_id, u.is_admin FROM users u WHERE u.id = $1 AND u.deleted_at IS NULL LIMIT 1`,
        [id],
      );

      if (!user) throw new NotFoundException('User not found');

      const params: any[] = [];

      const update = Object.keys(updateData)
        .map((key, index) => {
          params.push(updateData[key]);
          return `${key} = $${index + 1}`;
        })
        .join(', ');

      params.push(id);

      const queryUpdateUser = `UPDATE users SET ${update.length > 0 ? update + ',' : ''} updated_at = NOW() WHERE id = $${params.length} RETURNING *`;

      const [[updatedUser]]: [[User]] = await queryRunner.manager.query(
        queryUpdateUser,
        params,
      );

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Update pengguna berhasil',
        data: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23505'
      ) {
        this.error.handleError(new ConflictException('Email already exist'));
      }
      this.error.handleError(error, `${UserService.name}.${this.update.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const querySQL = `UPDATE users SET deleted_at = NOW() WHERE id = $1 RETURNING *`;
      const params = [id];

      const [[user]]: [User[]] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      if (!user) throw new NotFoundException('User not found');

      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete user success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${UserService.name}.${this.remove.name}`);
    } finally {
      await queryRunner.release();
    }
  }
}

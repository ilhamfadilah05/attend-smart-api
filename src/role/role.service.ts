import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/libs/entities/role.entity';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { Repository, DataSource } from 'typeorm';
import { ListRoleDto } from './dto/list-role.dto';
import { join } from 'path';
import * as fs from 'fs/promises';
import { DefaultAccess } from 'src/libs/interface';
import {
  ACCESS_ACTION,
  ACCESS_CATEGORY,
  AccessGrouped,
  STATUS_ACCESS_CATEGORY,
} from 'src/libs/constant';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private readonly repository: Repository<Role>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}

  async getPermissions() {
    try {
      const filePathDefaultAccess = join(
        __dirname,
        '..',
        'libs/config/default-access.json',
      );
      const permissions = await fs.readFile(filePathDefaultAccess, {
        encoding: 'utf-8',
      });

      const result: AccessGrouped[] = [];
      if (permissions) {
        const jsonPermissions: DefaultAccess[] = JSON.parse(permissions);

        jsonPermissions.forEach((item) => {
          if (item && item['subject']) {
            if (!item.name) item.name = ACCESS_ACTION[item.action];
            const category = item['subject'].split('/')[0];
            const accessCategory = ACCESS_CATEGORY[category] || {
              status: STATUS_ACCESS_CATEGORY.INACTIVE,
              name: null,
            };
            if (accessCategory?.status !== STATUS_ACCESS_CATEGORY.ACTIVE)
              return;

            const accessHide = accessCategory?.access_hide?.find(
              (access) =>
                access.action === item.action &&
                access.subject === item.subject,
            );
            if (accessHide) return;

            const currentGroup = result.find(
              (item) => item.category == category,
            );

            if (!currentGroup) {
              const tempGroup: AccessGrouped = {
                category,
                access_category: {
                  name: accessCategory.name,
                  status: accessCategory.status,
                },
                access: [...(accessCategory?.access || []), item],
              };
              result.push(tempGroup);
            } else {
              currentGroup.access.push(item);
            }
          }
        });
      }

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get all permissions success',
        data: result,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${RoleService.name}.${this.getPermissions.name}`,
      );
    }
  }

  async create(payload: CreateRoleDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const querySQL = `INSERT INTO roles (name, access) VALUES ($1,$2) RETURNING *`;

      const [newRole]: [Role] = await queryRunner.manager.query(querySQL, [
        payload.name,
        JSON.stringify(payload.permissions),
      ]);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Create role success',
        data: {
          id: newRole.id,
          name: newRole.name,
          access: newRole.access,
          created_at: newRole.created_at,
          updated_at: newRole.updated_at,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${RoleService.name}.${this.create.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListRoleDto) {
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
          created_at: {
            between: true,
            value: 'roles.created_at',
          },
        },
      );

      let orderBy = 'ORDER BY roles.created_at DESC';

      if (query.sort_by) {
        const column = this.queryHelper.sort(query.sort_by, [
          'created_at',
          'name',
        ]);
        if (column !== undefined) {
          orderBy = `ORDER BY ${column}`;
        }
      }

      const [roles, [countedRoles]]: [Role[], { total: number }[]] =
        await Promise.all([
          this.repository.query(
            `SELECT roles.id, roles.name, roles.created_at, roles.updated_at FROM roles WHERE roles.deleted_at IS NULL ${filter.where.q} ${orderBy} LIMIT $1 OFFSET $2 `,
            filter.param.q,
          ),
          this.repository.query(
            `SELECT COUNT(*) as total FROM roles WHERE roles.deleted_at IS NULL ${filter.where.c}`,
            filter.param.c,
          ),
        ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get all roles success',
        data: roles.map((role) => ({
          id: role.id,
          name: role.name,
          created_at: role.created_at,
          updated_at: role.updated_at,
        })),
        page: page,
        pageSize: limit,
        totalData: Number(countedRoles.total),
      });
    } catch (error) {
      this.error.handleError(error, `${RoleService.name}.${this.findAll.name}`);
    }
  }

  async findOne(id: string) {
    try {
      const [role]: [Role] = await this.repository.query(
        'SELECT * FROM roles WHERE id = $1 AND roles.deleted_at IS NULL LIMIT 1',
        [id],
      );

      if (!role) throw new NotFoundException('Role not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get detail role success',
        data: {
          id: role.id,
          name: role.name,
          access:
            typeof role.access === 'string'
              ? JSON.parse(role.access)
              : role.access,
          created_at: role.created_at,
          updated_at: role.updated_at,
        },
      });
    } catch (error) {
      this.error.handleError(error, `${RoleService.name}.${this.findOne.name}`);
    }
  }

  async update(id: string, payload: UpdateRoleDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const [role]: [Role] = await queryRunner.manager.query(
        'SELECT * FROM roles WHERE id = $1 AND deleted_at IS NULL LIMIT 1 ',
        [id],
      );

      if (!role) throw new NotFoundException('Role not found');

      const updateData = {
        name: payload.name ? payload.name : role.name,
        access:
          payload.permissions.length > 0
            ? JSON.stringify(payload.permissions)
            : JSON.stringify(role.access),
      };

      const querySQL = `UPDATE roles SET name = $1, access = $2, updated_at = NOW() WHERE id = $3 RETURNING *`;
      const params = [updateData.name, updateData.access, id];

      const [updatedRole]: [Role] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Update role success',
        data: {
          id: updatedRole.id,
          name: updatedRole.name,
          access: updatedRole.access,
          created_at: updatedRole.created_at,
          updated_at: updatedRole.updated_at,
        },
      });
    } catch (error) {
      this.error.handleError(error, `${RoleService.name}.${this.update.name}`);
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const querySQL = `UPDATE roles SET deleted_at = NOW() WHERE id = $1 RETURNING *`;
      const params = [id];

      const [[role]]: [Role[]] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      if (role.name === 'Super Admin') {
        throw new BadRequestException(`Cannot delete 'Super Admin'`);
      }

      if (!role) throw new NotFoundException('Role not found');
      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete role success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${RoleService.name}.${this.remove.name}`);
    } finally {
      await queryRunner.release();
    }
  }
}

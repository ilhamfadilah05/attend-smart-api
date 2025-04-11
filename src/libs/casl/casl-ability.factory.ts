import { PureAbility } from '@casl/ability';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '../entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export enum Action {
  create = 'create',
  read = 'read',
  update = 'update',
  delete = 'delete',
  export = 'export',
  import = 'import',
  manage = 'manage',
}
export type PermissionObjectType = any;

export type AppAbility = PureAbility<[Action, PermissionObjectType]>;

export interface UserRoles {
  id: string;
  name: string;
  email: string;
  roleId: string;
  iat: number;
  exp: number;
}

@Injectable()
export class CaslAbilityFactory {
  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
  ) {}

  async createForUser(user: UserRoles) {
    try {
      const [role]: Partial<Role>[] = await this.repository.query(
        'SELECT * FROM roles WHERE id = $1 LIMIT 1',
        [user.roleId],
      );

      if (!role) {
        throw new UnauthorizedException('Unauthorized');
      }
      const permissions =
        typeof role.access === 'string' ? JSON.parse(role.access) : role.access;

      if (!role) {
        return new PureAbility([]);
      }

      if (permissions.length === 0) {
        return new PureAbility([]);
      }

      const permissionActions = [];

      permissionActions.push(...permissions);

      const ability = new PureAbility(permissionActions);
      return ability;
    } catch (error) {
      throw error;
    }
  }
}

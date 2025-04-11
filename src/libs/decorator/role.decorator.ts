import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../casl/casl-policy.handler';
import { CaslRoleDecorator } from '../interface';

export const Roles = (...roles: CaslRoleDecorator[]) =>
  SetMetadata(ROLES_KEY, roles);

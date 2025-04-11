import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { PolicyHandler, ROLES_KEY } from '../casl/casl-policy.handler';
import { PureAbility } from '@casl/ability';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ACCESS_CATEGORY } from '../constant';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles =
      this.reflector.get<any[]>(ROLES_KEY, context.getHandler()) || [];

    if (!roles) {
      return true; // Jika tidak ada metadata roles, maka izinkan akses
    }

    /**
     * Kenapa ada 2 jenis pengecekan ini?
     * Dikarenakan saat pengembangan ada yang menggunakan decorator Roles dan Oacl
     * Jika menggunakan decorator Oacl, maka roles berisi array of Function
     * Jika menggunakan decorator Roles, maka roles berisi array of Object
     */

    // Memeriksa apakah roles berisi array of function
    const containsFunctions = roles.every((item) => typeof item === 'function');

    // Memeriksa apakah roles berisi array of object
    const containsObjects = roles.every((item) => typeof item === 'object');

    // Verifikasi peran sesuai dengan metadata roles yang diatur
    const request = context.switchToHttp().getRequest();

    // Ambil peran dari token JWT
    const userRoles = request.user;

    const ability = await this.caslAbilityFactory.createForUser(userRoles);

    // handle feature diluar API, melanjutin dari project benefis2.
    const features = ACCESS_CATEGORY.users.access;
    const additionalFeatures = [];
    for (let i = 0; i < features.length; i++) {
      if (
        ability.rules.find(
          (rule) =>
            rule.action === features[i].action &&
            rule.subject === features[i].subject,
        )
      ) {
        additionalFeatures.push(features[i]);
      }
    }
    request['additional-feature'] = additionalFeatures;

    // Check apakah peran yang dimiliki user memiliki akses ke resource

    if (containsObjects) {
      const grantAccess = roles.some((role) => {
        return ability.can(role.action, role.subject);
      });

      if (grantAccess) {
        return true;
      } else {
        throw new ForbiddenException(
          'You do not have the required permissions to access this resource. Please contact your administrator.',
        );
      }
    }

    if (containsFunctions) {
      return roles.every((handler) =>
        this.execPolicyHandler(handler, ability, context.switchToHttp()),
      );
    }
  }

  private execPolicyHandler(
    handler: PolicyHandler,
    ability: PureAbility,
    httpArgument: HttpArgumentsHost,
  ) {
    if (typeof handler === 'function') {
      const resultAbility = handler(ability);
      if (!resultAbility)
        throw new ForbiddenException(
          `Access restricted for this resource ${
            httpArgument.getRequest().route.path
          }`,
        );
      return resultAbility;
    }

    return handler.handle(ability);
  }
}

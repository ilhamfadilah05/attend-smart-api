import {
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { PureAbility } from '@casl/ability';
import * as fs from 'fs';
import { RoleGuard } from '../guard/role.guard';
import { CheckRoles } from '../casl/casl-policy.handler';
import { AuthGuard } from '../guard/auth.guard';
import * as path from 'path';
import { ACCESS_CATEGORY } from '../constant';

type ActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'public_get'
  | 'public_post'
  | 'post';

let isFirst = false;

export function Oacl(subject: string, actionType: ActionType, desc: string) {
  const filePathDefaultAccess = path.join(
    __dirname,
    '..',
    '/config/default-access.json',
  );

  if (isFirst) {
    fs.writeFileSync(filePathDefaultAccess, '[]');
    isFirst = false;
  }

  if (!actionType) actionType = 'read';

  const route = subject.replace(subject.split('/')[0], '');
  let methodDecorator: MethodDecorator = Get(route);
  let action = actionType;
  let usePolicy = true;

  switch (actionType) {
    case 'create':
      methodDecorator = Post(route);
      break;
    case 'read':
      methodDecorator = Get(route);
      break;
    case 'update':
      methodDecorator = Patch(route);
      break;
    case 'delete':
      methodDecorator = Delete(route);
      break;
    case 'public_get':
      methodDecorator = Get(route);
      action = 'read';
      usePolicy = false;
      break;
    case 'public_post':
      methodDecorator = Post(route);
      action = 'create';
      usePolicy = false;
      break;
    case 'post':
      methodDecorator = Post(route);
      break;
  }

  const jsonDefault = {
    subject,
    action,
    desc,
  };

  let policyDecorators: (
    | MethodDecorator
    | ClassDecorator
    | PropertyDecorator
  )[] = [];

  if (usePolicy) {
    try {
      const data = fs.readFileSync(filePathDefaultAccess, {
        encoding: 'utf-8',
      });
      let jsonData = [];
      if (data) {
        jsonData = JSON.parse(data);
      }
      jsonData.push(jsonDefault);
      jsonData = jsonData.concat(ACCESS_CATEGORY.users.access);
      jsonData = [
        ...new Map(
          jsonData.map((item) => {
            return [item['action'] + item['subject'], item];
          }),
        ).values(),
      ];

      const strData = JSON.stringify(jsonData);

      fs.writeFileSync(filePathDefaultAccess, strData);
    } catch {
      const jsonData = JSON.stringify([jsonDefault]);
      fs.promises.writeFile(filePathDefaultAccess, jsonData);
    }

    policyDecorators = [
      UseGuards(AuthGuard, RoleGuard),
      CheckRoles((ability: PureAbility) => ability.can(action, subject)),
    ];
  }

  return applyDecorators(methodDecorator, ...policyDecorators);
}

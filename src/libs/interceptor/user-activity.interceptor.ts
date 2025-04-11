import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { IJwtPayload, IResponseFormat } from '../interface';
import { DataSource } from 'typeorm';
import { UserActivity } from '../entities/user-activity.entity';
import { isUUID } from 'class-validator';
import { ActivityHelper } from '../helper/activity.helper';
import { User } from '../entities/user.entity';

const ACTIVITY_METHODS = ['POST', 'PATCH', 'DELETE'];
const TABLES = ['campaigns', 'campaign-groups', 'global_configs'];

@Injectable()
export class UserActivityInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  private tableName(name: string) {
    if (!TABLES.includes(name)) {
      switch (name) {
        case 'configs':
          return 'global_configs';
        case 'auth':
          return 'users';
        case 'zakats':
          return 'campaigns';
      }
    }

    return name;
  }

  private removeCol(data: Record<string, any>) {
    delete data?.created_at;
    delete data?.updated_at;
    delete data?.deleted_at;
  }

  private saveActivityLog(
    {
      id,
      user,
      lastPath,
      tableName,
      activity,
      ip,
    }: {
      id: string;
      tableName: string;
      lastPath?: string;
      ip: string;
      user: IJwtPayload;
      activity: {
        action: string;
        subject: string;
      };
    },
    dataBefore?: any,
  ) {
    this.dataSource
      .query(`SELECT * FROM ${tableName} WHERE id = $1`, [id])
      .then(async ([result]: any[]) => {
        this.removeCol(result);
        const userLoggedIn = {
          id: '',
          name: '',
          email: '',
          roleId: '',
          roleName: '',
        };
        if (!user?.name) {
          const [user] = (await this.dataSource.query(
            `
            SELECT u.id, u.name, u.email, u.role_id, r.name as role_name
            FROM users u 
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1 
            LIMIT 1`,
            [id],
          )) as User[];

          userLoggedIn.id = user.id;
          userLoggedIn.name = user.name;
          userLoggedIn.email = user.email;
          userLoggedIn.roleId = user['role_id'];
          userLoggedIn.roleName = user['role_name'];
        }

        const activityResult = this.dataSource.manager.create(UserActivity, {
          user_name: user?.name || userLoggedIn.name,
          user_email: user?.email || userLoggedIn.email,
          user_id: user?.id || userLoggedIn.id,
          role_name: user?.roleName || userLoggedIn.roleName,
          role_id: user?.roleId || userLoggedIn.roleId,
          table_id: id || lastPath,
          table_name: tableName,
          action_name: activity.action,
          subject_name: activity.subject,
          ip,
          data_before: dataBefore,
          data_after: result,
        });
        this.dataSource.manager.save(activityResult).catch((error) => {
          console.log('Error occured when trying to save user activity log');
          console.log(error);
        });
      })
      .catch((error) => {
        console.log(`Error occured when get data from table : ${tableName}`);
        console.log(error);
      });
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as IJwtPayload;
    const forwardedFor = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'] as string;

    let ip = request.ip || request.socket.remoteAddress;

    if (process.env.NODE_ENV === 'production') {
      ip = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor?.split(',')[0] || realIp || request.ip;
    }

    const id = request.params['id'];
    const path = request.path.split('/')[3]?.replace(/-/g, '_');
    let dataBefore: any;

    if (id !== undefined && id !== null && id) {
      const [result] = await this.dataSource.query(
        `SELECT * FROM ${this.tableName(path)} WHERE id = $1 LIMIT 1`,
        [id],
      );

      this.removeCol(result);
      dataBefore = result;
    }

    return next.handle().pipe(
      tap(async (body: IResponseFormat<{ id: string }>) => {
        try {
          const skip = request.path.split('/')[2];
          if (
            !request.path.includes('api') ||
            skip === undefined ||
            skip.charAt(0) !== 'v'
          )
            return;
          if (request.headers['x-req-type'] === 'export') {
            const tableName = this.tableName(path);
            const activity = ActivityHelper.getActivity(
              request.method,
              tableName,
            );
            this.dataSource
              .query(`SELECT * FROM users WHERE id = $1`, [id])
              .then(async ([result]: any[]) => {
                this.removeCol(result);
                const userLoggedIn = {
                  id: '',
                  name: '',
                  email: '',
                  roleId: '',
                  roleName: '',
                };
                if (!user?.name) {
                  const [user] = (await this.dataSource.query(
                    `
                    SELECT u.id, u.name, u.email, u.role_id, r.name as role_name
                    FROM users u 
                    JOIN roles r ON u.role_id = r.id
                    WHERE u.id = $1 
                    LIMIT 1`,
                    [id],
                  )) as User[];

                  userLoggedIn.id = user.id;
                  userLoggedIn.name = user.name;
                  userLoggedIn.email = user.email;
                  userLoggedIn.roleId = user['role_id'];
                  userLoggedIn.roleName = user['role_name'];
                }

                const activityResult = this.dataSource.manager.create(
                  UserActivity,
                  {
                    user_name: user?.name || userLoggedIn.name,
                    user_email: user?.email || userLoggedIn.email,
                    user_id: user?.id || userLoggedIn.id,
                    role_name: user?.roleName || userLoggedIn.roleName,
                    role_id: user?.roleId || userLoggedIn.roleId,
                    table_id: id,
                    table_name: 'users',
                    action_name: 'Mengekspor',
                    subject_name: activity.subject,
                    ip,
                    data_before: {
                      id: id,
                      name: user?.name || userLoggedIn.name,
                      email: user?.email || userLoggedIn.email,
                      role_name: user?.roleName || userLoggedIn.roleName,
                      role_id: user?.roleId || userLoggedIn.roleId,
                    },
                  },
                );
                this.dataSource.manager.save(activityResult).catch((error) => {
                  console.log(
                    'Error occured when trying to save user activity log',
                  );
                  console.log(error);
                });
              })
              .catch((error) => {
                console.log(`Error occured when get data from table : users`);
                console.log(error);
              });
          }

          if (
            request.path.includes('login') ||
            request.path.includes('logout')
          ) {
            const id = body?.data?.id || user.id;
            const str = request.path.split('/')[4];
            const action = str.charAt(0).toUpperCase() + str.slice(1);
            this.dataSource
              .query(`SELECT * FROM users WHERE id = $1`, [id])
              .then(async ([result]: any[]) => {
                this.removeCol(result);
                const userLoggedIn = {
                  id: '',
                  name: '',
                  email: '',
                  roleId: '',
                  roleName: '',
                };
                if (!user?.name) {
                  const [user] = (await this.dataSource.query(
                    `
                SELECT u.id, u.name, u.email, u.role_id, r.name as role_name
                FROM users u 
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = $1 
                LIMIT 1`,
                    [id],
                  )) as User[];

                  userLoggedIn.id = user.id;
                  userLoggedIn.name = user.name;
                  userLoggedIn.email = user.email;
                  userLoggedIn.roleId = user['role_id'];
                  userLoggedIn.roleName = user['role_name'];
                }

                const activityResult = this.dataSource.manager.create(
                  UserActivity,
                  {
                    user_name: user?.name || userLoggedIn.name,
                    user_email: user?.email || userLoggedIn.email,
                    user_id: user?.id || userLoggedIn.id,
                    role_name: user?.roleName || userLoggedIn.roleName,
                    role_id: user?.roleId || userLoggedIn.roleId,
                    table_id: id,
                    table_name: 'users',
                    action_name: action,
                    subject_name: action,
                    ip,
                    data_before: {
                      id: id,
                      name: user?.name || userLoggedIn.name,
                      email: user?.email || userLoggedIn.email,
                      role_name: user?.roleName || userLoggedIn.roleName,
                      role_id: user?.roleId || userLoggedIn.roleId,
                    },
                  },
                );
                this.dataSource.manager.save(activityResult).catch((error) => {
                  console.log(
                    'Error occured when trying to save user activity log',
                  );
                  console.log(error);
                });
              })
              .catch((error) => {
                console.log(`Error occured when get data from table : users`);
                console.log(error);
              });
            return;
          }

          if (ACTIVITY_METHODS.includes(request.method)) {
            const path = request.path.split('/')[3].replace(/-/g, '_');
            const tableName = this.tableName(path);
            const activity = ActivityHelper.getActivity(
              request.method,
              tableName,
            );

            if (request.method === 'POST') {
              const id = body.data?.id;

              this.saveActivityLog({
                id,
                activity,
                tableName,
                ip,
                user,
              });
            } else {
              const id = request.params['id'];
              let lastPath = request.path.split('/').pop();
              if (!isUUID(lastPath)) lastPath = null;

              this.saveActivityLog(
                {
                  id,
                  activity,
                  tableName,
                  ip,
                  user,
                },
                dataBefore,
              );
            }
          }
        } catch (error) {
          console.log(error);
        }
      }),
    );
  }
}

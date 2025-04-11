import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { Repository } from 'typeorm';
import { ListUserActivityDto } from './dto/list-user-activity.dto';
import { UserActivity } from 'src/libs/entities/user-activity.entity';

@Injectable()
export class UserActivityService {
  constructor(
    @InjectRepository(UserActivity)
    private readonly repository: Repository<UserActivity>,
    private readonly queryHelper: QueryHelper,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}

  async findAll(query: ListUserActivityDto, userId?: string) {
    try {
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      const filter = this.queryHelper.search(
        [
          {
            param: 'name',
            column: 'user_name',
            operator: 'ILIKE',
          },
          {
            param: 'email',
            column: 'user_email',
            operator: 'ILIKE',
          },
          {
            param: 'model',
            column: 'subject_name',
            operator: '=',
          },
          {
            param: 'action',
            column: 'action_name',
            operator: '=',
          },
          {
            param: 'ip',
            column: 'ip',
            operator: '=',
          },
        ],
        {
          queryString: query,
          params: [limit, offset],
          created_at: {
            between: true,
            value: 'created_at',
          },
        },
      );

      let orderBy = 'ORDER BY created_at DESC';

      if (query.sort_by) {
        const column = this.queryHelper.sort(query.sort_by, [
          'created_at',
          'name',
          'user_name',
          'user_email',
          'table_name',
          'action_name',
          'subject_name',
        ]);
        if (column !== undefined) {
          orderBy = `ORDER BY ${column}`;
        }
      }

      if (userId) {
        const q = (paramState: number) =>
          'user_id = $' + (Number(paramState) + 1);
        filter.where.q +=
          filter.where.q.length > 0
            ? ' AND' + q(filter.param.q.length)
            : 'WHERE ' + q(filter.param.q.length);
        filter.where.c +=
          filter.where.c.length > 0
            ? ' AND' + q(filter.param.c.length)
            : 'WHERE ' + q(filter.param.c.length);

        filter.param.q.push(userId);
        filter.param.c.push(userId);
      }

      const [userActivities, [countedActivities]]: [
        UserActivity[],
        { total: number }[],
      ] = await Promise.all([
        this.repository.query(
          `SELECT id, user_name, user_email, table_name, action_name, subject_name, ip, created_at, data_before, data_after FROM user_activities ${filter.where.q} ${orderBy} LIMIT $1 OFFSET $2`,
          filter.param.q,
        ),
        this.repository.query(
          `SELECT COUNT(*) as total FROM user_activities ${filter.where.c}`,
          filter.param.c,
        ),
      ]);

      const result = userActivities.map((activity) => {
        const dataBefore = activity.data_before;
        const dataAfter = activity.data_after;
        let is_changed = false;

        if (dataAfter === null) {
          delete activity.data_after;
          delete activity.data_before;
          return {
            ...activity,
            is_changed,
          };
        }
        for (const property in dataBefore) {
          if (property === 'user_agents') {
            dataBefore[property] = dataBefore[property][0] ?? '';
            dataAfter[property] = dataAfter[property][0] ?? '';
          }

          if (dataBefore[property] !== dataAfter[property]) {
            is_changed = true;
            break;
          }
        }

        delete activity.data_after;
        delete activity.data_before;
        return {
          ...activity,
          is_changed,
        };
      });

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get all roles success',
        data: result,
        page: page,
        pageSize: limit,
        totalData: Number(countedActivities.total),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${UserActivity.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const [userActivities] = (await this.repository.query(
        'SELECT id, user_name, user_email, table_name, action_name, subject_name, created_at, data_before, data_after FROM user_activities WHERE id = $1',
        [id],
      )) as UserActivity[];

      if (!userActivities) throw new NotFoundException('Activity not found');

      for (const property in userActivities.data_before) {
        if (property === 'user_agents') {
          userActivities.data_before[property] =
            userActivities.data_before[property][0] ?? '';
          userActivities.data_after[property] =
            userActivities.data_after[property][0] ?? '';
        }
      }

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: userActivities,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${UserActivityService.name}.${this.findOne.name}`,
      );
    }
  }
}

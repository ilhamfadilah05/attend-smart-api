import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBroadcastSendDto } from './dto/create-broadcast-send.dto';
import { UpdateBroadcastSendDto } from './dto/update-broadcast-send.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListBroadcastSendDto } from './dto/list-broadcast-send.dto';
import { BroadcastSend } from 'src/libs/entities/broadcast-send.entity';
import { Employee } from 'src/libs/entities/employee.entity';
import { IUpdateBroadcastSend } from 'src/libs/interface';
import { Broadcast } from 'src/libs/entities/broadcast.entity';

@Injectable()
export class BroadcastSendService {
  constructor(
    @InjectRepository(BroadcastSend)
    private readonly repository: Repository<BroadcastSend>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}
  async create(payload: CreateBroadcastSendDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const additional = {};
      additional['employeeId'] = 0;

      const parallelTasks = [
        queryRunner.query('SELECT id FROM employees WHERE id = $1', [
          payload.id_employee,
        ]),
      ];

      additional['broadcastId'] = parallelTasks.length;
      parallelTasks.push(
        queryRunner.query('SELECT id FROM broadcasts WHERE id = $1', [
          payload.id_broadcast,
        ]),
      );

      const tasksResult = (await Promise.all(parallelTasks)) as [[Broadcast]];

      if (!tasksResult[additional['employeeId']][0]) {
        throw new NotFoundException('Employee not found!');
      }

      if (!tasksResult[additional['broadcastId']][0]) {
        throw new NotFoundException('Broadcast not found!');
      }

      const group = new BroadcastSend();
      group.id_employee = { id: payload.id_employee } as Employee;
      group.id_broadcast = { id: payload.id_broadcast } as Broadcast;
      group.is_read = payload.is_read;
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
    }
  }

  async findAll(query: ListBroadcastSendDto) {
    try {
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      const SELECTED_COLUMNS = [
        'bs.id',
        'bs.id_employee',
        'bs.id_broadcast',
        'bs.is_read',
        'bs.created_at',
        'e.name as employee_name',
        'b.title as title',
        'b.body as body',
        'b.image as image',
      ];

      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      if (query.id_broadcast) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`bs.id_broadcast = $${paramIndex}`);
        searchParams.push(query.id_broadcast);
      }

      if (query.id_employee) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`bs.id_employee = $${paramIndex}`);
        searchParams.push(query.id_employee);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `AND ${searchConditions.join(' AND ')}`
          : '';

      // sorting logic
      let sortClause = 'ORDER BY created_at ASC';
      if (query.sort_by) {
        const validSortColumns = ['created_at'];

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
      const fetchBroadcastsQuery = `
        SELECT ${SELECTED_COLUMNS.join(', ')}
        FROM broadcast_sends bs
        LEFT JOIN employees e ON bs.id_employee = e.id
        LEFT JOIN broadcasts b ON bs.id_broadcast = b.id
        WHERE 1=1 ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchBroadcastsParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countBroadcastsQuery = `
        SELECT COUNT(*) as count
        FROM broadcast_sends bs
        WHERE 1=1 ${searchCondition}
      `;
      const countBroadcastsParams = searchParams;

      // Execute queries
      const [broadcastItem, [totalbroadcastItem]]: [
        any[],
        { count: number }[],
      ] = await Promise.all([
        this.repository.query(fetchBroadcastsQuery, fetchBroadcastsParams),
        this.repository.query(countBroadcastsQuery, countBroadcastsParams),
      ]);

      // Format response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get broadcast success',
        data: broadcastItem,
        page,
        pageSize: limit,
        totalData: Number(totalbroadcastItem.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${BroadcastSendService.name}.${this.findAll.name}`,
      );
    }
  }

  async countBroadcastSendsNotRead(id_employee: string) {
    try {
      const [broadcastsend] = await this.repository.query(
        'SELECT COUNT(*) as count FROM broadcast_sends WHERE id_employee = $1 AND is_read = $2',
        [id_employee, false],
      );

      if (!broadcastsend)
        throw new NotFoundException('BroadcastSend not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { count: Number(broadcastsend.count) },
      });
    } catch (error) {
      this.error.handleError(error);
    }
  }

  async findOne(id: string) {
    try {
      const [broadcastsend] = (await this.repository.query(
        'SELECT * FROM broadcast_sends WHERE id = $1',
        [id],
      )) as BroadcastSend[];

      if (!broadcastsend)
        throw new NotFoundException('BroadcastSend not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: broadcastsend,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${BroadcastSendService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(id: string, payload: UpdateBroadcastSendDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const [broadcastsend] = (await queryRunner.manager.query(
        'SELECT id FROM broadcast_sends WHERE id = $1',
        [id],
      )) as BroadcastSend[];
      if (!broadcastsend)
        throw new NotFoundException('BroadcastSend not found');

      const additional = {};
      additional['employeeId'] = 0;

      const parallelTasks = [
        queryRunner.query('SELECT id FROM employees WHERE id = $1', [
          payload.id_employee,
        ]),
      ];

      additional['broadcastId'] = parallelTasks.length;
      parallelTasks.push(
        queryRunner.query('SELECT id FROM broadcasts WHERE id = $1', [
          payload.id_broadcast,
        ]),
      );

      const tasksResult = (await Promise.all(parallelTasks)) as [[Broadcast]];

      if (!tasksResult[additional['employeeId']][0]) {
        throw new NotFoundException('Employee not found!');
      }

      if (!tasksResult[additional['broadcastId']][0]) {
        throw new NotFoundException('Broadcast not found!');
      }

      const { updateQuery, params } = this.queryHelper.update<
        Partial<IUpdateBroadcastSend>
      >(id, {
        id_broadcast: payload.id_broadcast,
        id_employee: payload.id_employee,
        is_read: payload.is_read,
      });

      const querySQL = `UPDATE broadcast_sends SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      await queryRunner.manager.query(querySQL, params);
      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${BroadcastSend.name}.${this.findOne.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const querySQL = `TRUNCATE FROM broadcast_sends WHERE id = $1 CASCADE`;
      const params = [id];

      const [[broadcastsend]]: [BroadcastSend[]] =
        await queryRunner.manager.query(querySQL, params);

      if (!broadcastsend)
        throw new NotFoundException('BroadcastSend not found');

      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete broadcastsend success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${BroadcastSendService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

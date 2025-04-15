import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListBroadcastDto } from './dto/list-broadcast.dto';
import { Broadcast } from 'src/libs/entities/broadcast.entity';
import { FirebaseStorageService } from 'src/libs/service/firebase/firebase-storage.service';
import { v4 as uuid } from 'uuid';
import { Employee } from 'src/libs/entities/employee.entity';
import { FirebaseMessagingService } from 'src/libs/service/firebase/firebase-messaging.service';
import { BroadcastSendService } from 'src/broadcast-send/broadcast-send.service';

@Injectable()
export class BroadcastService {
  constructor(
    @InjectRepository(Broadcast)
    private readonly repository: Repository<Broadcast>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
    private readonly fs: FirebaseStorageService,
    private readonly fcm: FirebaseMessagingService,
    private readonly broadcastSendService: BroadcastSendService,
  ) {}
  async create(payload: CreateBroadcastDto, image: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';

    try {
      if (image) {
        // set image name
        imageName = 'broadcasts/' + uuid() + '.' + image.mimetype.split('/')[1];

        // upload image
        const imageUrl = await this.fs.uploadFile({
          file: image,
          fileName: imageName,
        });

        imageName = imageUrl;
      }
      const group = new Broadcast();
      group.title = payload.title;
      group.body = payload.body;
      group.image = imageName;

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

  async findAll(query: ListBroadcastDto) {
    try {
      // Pagination
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      // Selected column
      const SELECTED_COLUMNS = ['id', 'title', 'body', 'image', 'created_at'];

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      // filter by exact amount
      if (query.title !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(title) LIKE $${paramIndex}`);
        searchParams.push(`%${query.title.toLowerCase()}%`);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `deleted_at IS NULL AND ${searchConditions.join(' AND ')}`
          : 'deleted_at IS NULL';

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
        FROM broadcasts
        WHERE ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchBroadcastsParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countBroadcastsQuery = `
        SELECT COUNT(*) as count
        FROM broadcasts
        WHERE ${searchCondition}
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
        `${BroadcastService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const [Broadcast] = (await this.repository.query(
        'SELECT * FROM broadcasts WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as Broadcast[];

      if (!Broadcast) throw new NotFoundException('Broadcast not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: Broadcast,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${BroadcastService.name}.${this.findOne.name}`,
      );
    }
  }

  async sendBroadcast(id: string) {
    try {
      const [broadcast] = (await this.repository.query(
        'SELECT * FROM broadcasts WHERE id = $1',
        [id],
      )) as Broadcast[];

      if (!broadcast) throw new NotFoundException('Broadcast not found');

      const employee = (await this.repository.query(
        'SELECT * FROM employees',
        [],
      )) as Employee[];

      if (!employee) throw new NotFoundException('Employee not found');

      for (const emp of employee) {
        const data = {
          id_broadcast: broadcast.id,
          id_employee: emp.id,
          title: broadcast.title,
          body: broadcast.body,
          image: broadcast.image,
        };

        await this.fcm.sendNotification(emp.token_notif, data);

        await this.broadcastSendService.create({
          id_broadcast: broadcast.id,
          id_employee: emp.id,
          is_read: false,
        });
      }

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${BroadcastService.name}.${this.sendBroadcast.name}`,
      );
    }
  }

  async update(
    id: string,
    payload: UpdateBroadcastDto,
    image: Express.Multer.File,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';
    try {
      const [broadcast] = (await queryRunner.manager.query(
        'SELECT id, image FROM broadcasts WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as Broadcast[];
      if (!broadcast) throw new NotFoundException('Broadcast not found');

      // check image
      if (image) {
        if (broadcast.image) {
          // delete before image
          await this.fs.removeFile(
            'broadcasts/' +
              broadcast.image.split('/')[broadcast.image.split('/').length - 1],
          );
        }

        // upload new image
        imageName = 'broadcasts/' + uuid() + '.' + image.mimetype.split('/')[1];

        // upload
        const imageUrl = await this.fs.uploadFile({
          file: image,
          fileName: imageName,
        });

        imageName = imageUrl;
      }

      const { updateQuery, params } = this.queryHelper.update(id, {
        title: payload.title,
        body: payload.body,
        image: imageName,
      });

      const querySQL = `UPDATE broadcasts SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      await queryRunner.manager.query(querySQL, params);
      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${Broadcast.name}.${this.findOne.name}`);
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
      //   'SELECT image FROM broadcasts WHERE id = $1',
      //   [id],
      // )) as Broadcast[];

      // // check before image
      // if (resultImage.image) {
      //   // delete before image
      //   await this.fs.removeFile(
      //     'broadcasts/' +
      //       resultImage.image.split('/')[
      //         resultImage.image.split('/').length - 1
      //       ],
      //   );
      // }

      const querySQL = `UPDATE broadcasts SET deleted_at = NOW() WHERE id = $1 RETURNING *`;
      const params = [id];

      const [[broadcast]]: [Broadcast[]] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      if (!broadcast) throw new NotFoundException('Broadcast not found');

      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete broadcast success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${BroadcastService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

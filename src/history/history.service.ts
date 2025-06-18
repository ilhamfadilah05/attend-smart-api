/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListHistoryDto } from './dto/list-history.dto';
import { History } from 'src/libs/entities/history.entity';
import { Department } from 'src/libs/entities/department.entity';
import { Branch } from 'src/libs/entities/branch.entity';
import { IUpdateHistory } from 'src/libs/interface';
import { FirebaseStorageService } from 'src/libs/service/firebase/firebase-storage.service';
import { v4 as uuid } from 'uuid';
import { Employee } from 'src/libs/entities/employee.entity';
import { delay } from 'rxjs';
import { Submission } from 'src/libs/entities/submission.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private readonly repository: Repository<History>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
    private readonly fs: FirebaseStorageService,
  ) {}

  async getDateRange(date: string, isGte: boolean) {
    if (date.includes('T')) {
      // Jika sudah ada waktu, pakai langsung
      return new Date(date).toISOString();
    }

    // Jika hanya ada tanggal, tambahkan waktu
    if (isGte) {
      return new Date(`${date}T00:00:00.000`).toISOString();
    } else {
      return new Date(`${date}T23:59:59.999`).toISOString();
    }
  }

  async create(payload: CreateHistoryDto, image: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';
    try {
      console.log('payload', payload);

      // check employee
      const [employee] = await queryRunner.manager.query(
        'SELECT id, id_department, id_branch FROM employees WHERE id = $1 ',
        [payload.id_employee],
      );

      // validate
      if (!employee) throw new NotFoundException('Employee not found');

      // get department and branch
      const idDepartment = employee['id_department'];
      const idBranch = employee['id_branch'];

      // check department
      const department: Department[] = await queryRunner.query(
        'SELECT id FROM departments WHERE id = $1',
        [idDepartment],
      );

      if (!department || department.length === 0) {
        throw new NotFoundException('Department id is not found');
      }

      // check branch
      const branch: Branch[] = await queryRunner.query(
        'SELECT id, tolerance, work_start_time, work_end_time FROM branches WHERE id = $1',
        [idBranch],
      );

      if (!branch || branch.length === 0) {
        throw new NotFoundException('Branch id is not found');
      }

      let imageUrl = '';

      if (image) {
        // upload image
        imageName = 'histories/' + uuid() + '.' + image.mimetype.split('/')[1];

        imageUrl = await this.fs.uploadFile({
          file: image,
          fileName: imageName,
        });
      }

      // create group
      const group = new History();
      group.id_employee = payload.id_employee
        ? ({ id: payload.id_employee } as Employee)
        : null;
      group.lat_long = payload.lat_long;
      group.date_attend = payload.date_attend;
      group.delayed = payload.delayed;
      group.type = payload.type;
      group.address = payload.address;
      group.image = imageUrl;
      group.id_submission = { id: payload.id_submission } as Submission;
      group.deleted_at = null;

      await queryRunner.manager.save(group);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${this.create.name}`);

      if (imageName.length > 0) {
        await this.fs.removeFile(imageName);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListHistoryDto) {
    try {
      // pagination
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      // Selected columns
      const SELECTED_COLUMN = [
        'h.id',
        'h.type',
        'h.date_attend',
        'h.delayed',
        'h.address',
        'h.image',
        'h.created_at',
        'h.lat_long',
        'e.name as employee_name',
        'd.name as department_name',
        'b.name as branch_name',
      ];

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      if (query.id_employee !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`h.id_employee = $${paramIndex}`);
        searchParams.push(query.id_employee);
      }

      if (query.id_branch !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`h.id_branch = $${paramIndex}`);
        searchParams.push(query.id_branch);
      }

      if (query.id_department !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`h.id_department = $${paramIndex}`);
        searchParams.push(query.id_department);
      }

      if (query.type) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`h.type = $${paramIndex}`);
        searchParams.push(query.type);
      }

      if (query.date_attend_gte && query.date_attend_lte) {
        const startDate = `${query.date_attend_gte}T00:00:00`;
        const endDate = `${query.date_attend_lte}T23:59:59`;

        const paramIndex = searchParams.length + 1;
        searchConditions.push(
          `h.date_attend BETWEEN $${paramIndex} AND $${paramIndex + 1}`,
        );

        console.log('searchParams', startDate, endDate);

        searchParams.push(startDate, endDate);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `WHERE h.deleted_at IS NULL AND ${searchConditions.join(' AND ')}`
          : 'WHERE h.deleted_at IS NULL';

      // Sorting logic
      let sortClause = 'ORDER BY h.date_attend DESC';

      if (query.sort_by) {
        const columnMap = {
          name: 'e.name',
          date_attend: 'h.date_attend',
          type: 'h.type',
          delayed: 'h.delayed',
          department_name: 'd.name',
          branch_name: 'b.name',
        };

        console.log('searchParams', query.sort_by);

        const [columnKey, order] = query.sort_by.split('-');

        const column = columnMap[columnKey];

        if (column) {
          const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
          sortClause = `ORDER BY ${column} ${sortOrder}`;
        }
      }

      // Fetch historys query and parameters
      const fetchHistorysQuery = `
        SELECT ${SELECTED_COLUMN.join(', ')}
        FROM histories h
        LEFT JOIN employees e ON e.id = h.id_employee
        LEFT JOIN branches b ON b.id = e.id_branch
        LEFT JOIN departments d ON d.id = e.id_department
        ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;

      const fetchHistorysParams = [...searchParams, limit, offset];

      // Count total historys query and parameters
      const countHistorysQuery = `
        SELECT COUNT(*) as count
        FROM histories h
        LEFT JOIN employees e ON e.id = h.id_employee
        ${searchCondition}
      `;
      const countHistorysParams = searchParams;

      // Execute queries
      const [historys, [totalHistorys]]: [History[], { count: number }[]] =
        await Promise.all([
          this.repository.query(fetchHistorysQuery, fetchHistorysParams),
          this.repository.query(countHistorysQuery, countHistorysParams),
        ]);

      // Format response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get history success',
        data: historys,
        page: page,
        pageSize: limit,
        totalData: Number(totalHistorys.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${HistoryService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      // Selected columns
      const SELECTED_COLUMN = [
        'h.id',
        'h.lat_long',
        'h.date_attend',
        'h.delayed',
        'h.type',
        'h.address',
        'h.image',
        'e.id as id_employee',
        'e.name as name_employee',
        'b.lat_long as lat_long_branch',
        'b.radius as radius_branch',
      ];

      const [history] = (await this.repository.query(
        `SELECT ${SELECTED_COLUMN.join(', ')}
         FROM histories h
         LEFT JOIN employees e ON e.id = h.id_employee
         LEFT JOIN branches b ON b.id = e.id_branch
         WHERE h.id = $1 AND h.deleted_at IS NULL`,
        [id],
      )) as History[];

      if (!history) throw new NotFoundException('History not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: history,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${HistoryService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(
    id: string,
    payload: UpdateHistoryDto,
    image: Express.Multer.File,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';
    try {
      const [history] = (await queryRunner.manager.query(
        'SELECT id FROM histories WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as History[];

      if (!history) throw new NotFoundException('History not found');

      // check employee
      const [employee] = await queryRunner.manager.query(
        'SELECT id FROM employees WHERE id = $1 AND deleted_at IS NULL',
        [payload.id_employee],
      );

      // validate
      if (!employee) throw new NotFoundException('Employee not found');

      // check image
      if (image) {
        // check before image
        if (history.image) {
          // delete before image
          await this.fs.removeFile(
            'histories/' +
              history.image.split('/')[history.image.split('/').length - 1],
          );
        }

        // set new name image
        imageName = 'histories/' + uuid() + '.' + image.mimetype.split('/')[1];

        // upload image
        const imageUrl = await this.fs.uploadFile({
          file: image,
          fileName: imageName,
        });
        imageName = imageUrl;
      }
      const { updateQuery, params } = this.queryHelper.update<
        Partial<IUpdateHistory>
      >(id, {
        id_employee: payload.id_employee,
        lat_long: payload.lat_long,
        date_attend: payload.date_attend,
        delayed: payload.delayed,
        type: payload.type,
        address: payload.address,
        image: imageName,
      });

      const querySQL = `UPDATE histories SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      await queryRunner.manager.query(querySQL, params);
      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${History.name}.${this.findOne.name}`);
      if (imageName.length > 0) {
        await this.fs.removeFile(imageName);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Format tanggal ke ISO string agar diterima oleh PostgreSQL
      const now = new Date().toISOString();

      const querySQL = `
      UPDATE histories
      SET deleted_at = $1
      WHERE id = $2 
      RETURNING *;
    `;
      const params = [now, id];

      const result = await queryRunner.manager.query(querySQL, params);

      if (result.length === 0) {
        throw new NotFoundException('Histories not found');
      }

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete histories success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${HistoryService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

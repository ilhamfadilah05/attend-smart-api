import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListSubmissionDto } from './dto/list-submission.dto';
import { Submission } from 'src/libs/entities/submission.entity';
import { Employee } from 'src/libs/entities/employee.entity';
import { IUpdateSubmission } from 'src/libs/interface';
import { v4 as uuid } from 'uuid';
import { FirebaseStorageService } from 'src/libs/service/firebase/firebase-storage.service';
import { HistoryService } from 'src/history/history.service';

@Injectable()
export class SubmissionService {
  constructor(
    @InjectRepository(Submission)
    private readonly repository: Repository<Submission>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
    private readonly fs: FirebaseStorageService,
    private readonly historyService: HistoryService,
  ) {}

  async create(payload: CreateSubmissionDto, image: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';
    try {
      // check employee
      const [employee] = (await queryRunner.manager.query(
        'SELECT id FROM employees WHERE id = $1',
        [payload.id_employee],
      )) as Employee[];

      // validate
      if (!employee) throw new NotFoundException('Employee not found');

      const group = new Submission();
      group.employee = { id: payload.id_employee } as Employee;
      group.type = payload.type;
      group.status = payload.status;
      group.reason = payload.reason;
      group.start_date = payload.start_date;
      group.end_date = payload.end_date;

      if (image) {
        imageName = 'submission/' + uuid() + '.' + image.mimetype.split('/')[1];

        const imageUrl = await this.fs.uploadFile({
          file: image,
          fileName: imageName,
        });

        group.image = imageUrl;
      }

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
      if (imageName.length > 0) {
        await this.fs.removeFile(imageName);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListSubmissionDto) {
    try {
      // Pagination
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      // Selected column
      const SELECTED_COLUMNS = [
        's.id',
        's.type',
        's.status',
        's.reason',
        's.image',
        's.start_date',
        's.end_date',
        's.created_at',
        'e.id as id_employee',
        'e.name as employee_name',
        'd.name as department_name',
      ];

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      // filter by exact amount
      if (query.name !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(e.name) LIKE $${paramIndex}`);
        searchParams.push(`%${query.name.toLowerCase()}%`);
      }

      if (query.id_employee !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`e.id = $${paramIndex}`);
        searchParams.push(query.id_employee);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `AND s.deleted_at IS NULL AND ${searchConditions.join(' AND ')}`
          : 's.deleted_at IS NULL';

      // sorting logic
      let sortClause = 'ORDER BY s.created_at DESC';
      if (query.sort_by) {
        const validSortColumns = ['s.created_at'];

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
      const fetchSubmissionsQuery = `
        SELECT ${SELECTED_COLUMNS.join(', ')}
        FROM submissions AS s
        LEFT JOIN employees AS e ON s.id_employee = e.id
        LEFT JOIN departments AS d ON e.id_department = d.id
        WHERE ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchSubmissionsParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countSubmissionsQuery = `
        SELECT COUNT(*) as count
        FROM submissions AS s
        LEFT JOIN employees AS e ON s.id_employee = e.id
        WHERE ${searchCondition}
      `;
      const countSubmissionsParams = searchParams;

      // Execute queries
      const [salaryItem, [totalsalaryItem]]: [any[], { count: number }[]] =
        await Promise.all([
          this.repository.query(fetchSubmissionsQuery, fetchSubmissionsParams),
          this.repository.query(countSubmissionsQuery, countSubmissionsParams),
        ]);

      // Format response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get submissions success',
        data: salaryItem,
        page,
        pageSize: limit,
        totalData: Number(totalsalaryItem.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${SubmissionService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      // Selected column
      const SELECTED_COLUMNS = [
        's.id',
        's.type',
        's.status',
        's.reason',
        's.image',
        's.start_date',
        's.end_date',
        'e.id as id_employee',
        'e.name as employee_name',
        'd.name as department_name',
      ];

      const [submission] = (await this.repository.query(
        `SELECT ${SELECTED_COLUMNS.join(', ')} FROM submissions s
        LEFT JOIN employees AS e ON s.id_employee = e.id
        LEFT JOIN departments AS d ON e.id_department = d.id
        WHERE s.id = $1 AND s.deleted_at IS NULL`,
        [id],
      )) as Submission[];

      if (!submission) throw new NotFoundException('Submission not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: submission,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${SubmissionService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(
    id: string,
    payload: UpdateSubmissionDto,
    image: Express.Multer.File,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';

    try {
      // check submission
      const [submission] = (await queryRunner.manager.query(
        'SELECT id, image, status, id_employee FROM submissions WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as Submission[];

      // validate
      if (!submission) throw new NotFoundException('Submission not found');

      // check employee
      const [employeess] = (await queryRunner.manager.query(
        'SELECT id FROM employees WHERE id = $1 AND deleted_at IS NULL',
        [payload.id_employee],
      )) as Employee[];

      // validate
      if (!employeess) throw new NotFoundException('Employee not found');

      // check status if approved
      if (submission.status === 'approved') {
        throw new BadRequestException('Submission already approved');
      }

      // check status if pending & payload status approved
      if (submission.status === 'pending' && payload.status === 'approved') {
        // Parsing start date and end date
        const startDate = new Date(payload.start_date);
        const endDate = new Date(`${payload.end_date}T23:59:59.999`);

        // Iterate through the date range
        for (
          let date = new Date(startDate);
          date <= endDate;
          date.setDate(date.getDate() + 1)
        ) {
          console.log('date', date);
          // Create history for each day in the range
          await this.historyService.create(
            {
              id_submission: id,
              id_employee: payload.id_employee,
              lat_long: '0,0',
              date_attend: date, // Set the specific date
              delayed: 0,
              type: payload.type,
              address: '',
              image: null,
            },
            null,
          );
        }
      }

      // check image
      if (image) {
        // check before image
        if (submission.image) {
          // delete before image
          await this.fs.removeFile(
            'submission/' +
              submission.image.split('/')[
                submission.image.split('/').length - 1
              ],
          );
        }

        // set new name image
        imageName = 'submission/' + uuid() + '.' + image.mimetype.split('/')[1];

        // upload image
        const imageUrl = await this.fs.uploadFile({
          file: image,
          fileName: imageName,
        });
        imageName = imageUrl;
      }

      const { updateQuery, params } = this.queryHelper.update<
        Partial<IUpdateSubmission>
      >(id, {
        type: payload.type,
        id_employee: payload.id_employee,
        status: payload.status,
        reason: payload.reason,
        image: imageName,
        start_date: payload.start_date,
        end_date: (() => {
          const date = new Date(payload.end_date);
          date.setHours(23, 59, 59, 999);
          return date;
        })(),
      });

      const querySQL = `UPDATE submissions SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      await queryRunner.manager.query(querySQL, params);
      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${Submission.name}.${this.findOne.name}`);
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
      const querySQL = `UPDATE submissions SET deleted_at = NOW() WHERE id = $1 RETURNING *`;
      const params = [id];

      const [[submission]]: [Submission[]] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      if (!submission) throw new NotFoundException('Submission not found');

      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete submission success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${SubmissionService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

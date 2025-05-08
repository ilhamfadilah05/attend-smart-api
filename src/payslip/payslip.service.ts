import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreatePayslipDto } from './dto/create-payslip.dto';
import { UpdatePayslipDto } from './dto/update-payslip.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListPayslipDto } from './dto/list-payslip.dto';
import { Payslip } from 'src/libs/entities/payslip.entity';
import { Cron } from '@nestjs/schedule';
import { Employee } from 'src/libs/entities/employee.entity';
import { Salary } from 'src/libs/entities/salary.entity';
import { EmployeeService } from 'src/employee/employee.service';
import { SalaryService } from 'src/salary/salary.service';
import { HistoryService } from 'src/history/history.service';

@Injectable()
export class PayslipService {
  private readonly logger = new Logger(PayslipService.name);
  constructor(
    @InjectRepository(Payslip)
    private readonly repository: Repository<Payslip>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
    private readonly employeeService: EmployeeService,
    private readonly salaryService: SalaryService,
    private readonly historyService: HistoryService,
  ) {}
  // Menghitung jumlah hari kerja dari Senin sampai Jumat pada bulan kemarin
  async countWorkingDays(startDate: Date, endDate: Date): Promise<number> {
    let count = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const day = currentDate.getDay();
      // Jika hari Senin (1) sampai Jumat (5)
      if (day >= 1 && day <= 5) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
  }

  // 💼 Fungsi untuk Membuat Slip Gaji Otomatis
  @Cron('0 0 6 1 * *', { timeZone: 'Asia/Jakarta' }) // Setiap tanggal 1 jam 6 pagi
  async handlePayrollGeneration() {
    this.logger.debug('Membuat slip gaji otomatis...');
    try {
      // get data employee
      const employees = (await this.repository.query(
        'SELECT * FROM employees WHERE deleted_at IS NULL',
        [],
      )) as Employee[];

      // loop employee
      for (const employee of employees) {
        // get data salary employee
        const salary = (await this.repository.query(
          'SELECT * FROM salaries WHERE id = $1',
          [employee['id_salary']],
        )) as Salary[];

        // check if salary is empty
        if (salary.length < 0) {
          break;
        }

        // get date before 1 month
        const now = new Date();
        const firstDayLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // count attendance
        const countAttendance = (await this.repository.query(
          `SELECT COUNT(*) as attendance_days 
          FROM histories 
          WHERE id_employee = $1 AND 
          deleted_at IS NULL AND 
          type != 'KELUAR' AND 
          type != 'LEMBUR' AND 
          date_attend >= $2 AND date_attend <= $3`,
          [employee.id, firstDayLastMonth, lastDayLastMonth],
        )) as number;

        const attendanceDays = countAttendance[0]['attendance_days'];

        // count overtime
        const countOvertime = (await this.repository.query(
          `SELECT COUNT(*) as overtime_days 
          FROM histories 
          WHERE id_employee = $1 AND 
          deleted_at IS NULL AND
          type = 'LEMBUR' AND 
          date_attend >= $2 AND 
          date_attend <= $3`,
          [employee.id, firstDayLastMonth, lastDayLastMonth],
        )) as number;

        const overtimeDays = countOvertime[0]['overtime_days'];

        const totalWorkingDays = await this.countWorkingDays(
          firstDayLastMonth,
          lastDayLastMonth,
        );

        const absenceDays = totalWorkingDays - attendanceDays;

        console.log(attendanceDays, 'Total Attendace Days');
        console.log(totalWorkingDays, 'Total Working Days');
        console.log(absenceDays, 'Total Absence Days');
        console.log(overtimeDays, 'Total Overtime Days');

        // create payslip
        await this.create({
          id_employee: employee.id,
          id_salary: employee['id_salary'],
          absence_days: absenceDays,
          attendance_days: attendanceDays,
          overtime_days: overtimeDays,
          payroll_month: lastDayLastMonth,
        });
      }
      this.logger.debug('Slip gaji berhasil dibuat!');
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
    }
  }

  async create(payload: CreatePayslipDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const group = new Payslip();
      group.id_employee = { id: payload.id_employee } as Employee;
      group.id_salary = { id: payload.id_salary } as Salary;
      group.absence_days = payload.absence_days;
      group.attendance_days = payload.attendance_days;
      group.overtime_days = payload.overtime_days;
      group.payroll_month = payload.payroll_month;
      group.deleted_at = null;

      queryRunner.manager.save(group);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {},
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${this.create.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListPayslipDto) {
    try {
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      const SELECTED_COLUMNS = [
        'p.id',
        'p.absence_days',
        'p.attendance_days',
        'p.payroll_month',
        'p.created_at',
      ];

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      // filter by id employee
      if (query.id_employee !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`p.id_employee = $${paramIndex}`);
        searchParams.push(query.id_employee);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `AND ${searchConditions.join(' AND ')}`
          : '';

      let sortClause = 'ORDER BY p.created_at ASC';

      // sorting logic
      if (query.sort_by) {
        const validSortColumns = ['p.created_at'];

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
      const fetchDataQuery = `
        SELECT ${SELECTED_COLUMNS.join(', ')}
        FROM payslips AS p
        WHERE 1=1 ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchDataParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countDataQuery = `
        SELECT COUNT(*) as count
        FROM payslips AS p
        WHERE 1=1 ${searchCondition}
      `;
      const countDataParams = searchParams;

      // Execute queries
      const [dataItem, [totalItem]]: [any[], { count: number }[]] =
        await Promise.all([
          this.repository.query(fetchDataQuery, fetchDataParams),
          this.repository.query(countDataQuery, countDataParams),
        ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get branch success',
        data: dataItem,
        page: page,
        pageSize: limit,
        totalData: Number(totalItem.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${PayslipService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const SELECTED_COLUMNS = [
        'p.id',
        'e.name as employee_name',
        'e.id as id_employee',
        'd.name as department_name',
        'p.payroll_month',
        's.base_salary',
        's.meal_allowance',
        's.health_allowance',
        'p.overtime_days',
        's.overtime_amount',
        's.bonus_amount',
        'p.created_at',
        'p.attendance_days',
        'p.absence_days',
        's.absence_deduction_amount',
      ];

      const [data] = (await this.repository.query(
        `SELECT ${SELECTED_COLUMNS.join(', ')} 
        FROM payslips as p 
        LEFT JOIN employees e ON e.id = p.id_employee
        LEFT JOIN salaries s ON s.id = p.id_salary
        LEFT JOIN departments d ON d.id = e.id_department
        WHERE p.id = $1`,
        [id],
      )) as Payslip[];

      if (!data) throw new NotFoundException('Payslip not found');

      // set total bonus
      let totalBonus = Number(data['bonus_amount']);

      // set date payroll
      const lastMonthSalary = new Date(data['payroll_month']);

      // set first day of month
      const firstMonthSalary = new Date(
        lastMonthSalary.getFullYear(),
        lastMonthSalary.getMonth(),
        2,
      );
      firstMonthSalary.setHours(0, 0, 0, 0);

      // set last day of month
      const endOfMonth = new Date(
        lastMonthSalary.getFullYear(),
        lastMonthSalary.getMonth() + 1,
        0,
      );
      endOfMonth.setHours(23, 59, 59);

      // count attendance
      const countDataHistories = (await this.repository.query(
        `SELECT SUM(delayed) as delayed
         FROM histories 
         WHERE id_employee = $1 AND 
         deleted_at IS NULL AND 
         type != 'KELUAR' AND 
         date_attend >= $2 AND date_attend <= $3`,
        [data['id_employee'], firstMonthSalary, endOfMonth],
      )) as number;

      // set data delayed
      const dataDelayed = countDataHistories[0]['delayed'];

      // set total bonus if delayed > 60 or absence days !== 0
      if (dataDelayed > 60 || data.absence_days !== 0) {
        totalBonus = 0;
      }

      // total overtime
      const totalOvertime =
        Number(data['overtime_amount']) * Number(data['overtime_days']);

      // total deduction
      const totalDeduction =
        Number(data['absence_deduction_amount']) * Number(data['absence_days']);

      // total received
      const totalReceived =
        Number(data['base_salary']) +
        totalBonus +
        Number(data['meal_allowance']) +
        Number(data['health_allowance']) +
        totalOvertime;

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          ...data,
          base_salary: Number(data['base_salary']),
          meal_allowance: Number(data['meal_allowance']),
          health_allowance: Number(data['health_allowance']),
          overtime_amount: Number(data['overtime_amount']),
          absence_deduction_amount: Number(data['absence_deduction_amount']),
          total_overtime: totalOvertime,
          total_bonus: totalBonus,
          total_received: totalReceived,
          total_deduction: totalDeduction,
          total_salary: totalReceived - totalDeduction,
        },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${PayslipService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(id: string, payload: UpdatePayslipDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const [Payslip] = (await queryRunner.manager.query(
        'SELECT id FROM payslips WHERE id = $1',
        [id],
      )) as Payslip[];
      if (!Payslip) throw new NotFoundException('Payslip not found');

      const { updateQuery, params } = this.queryHelper.update<Partial<Payslip>>(
        id,
        {
          // name: payload.name,
        },
      );

      const querySQL = `UPDATE payslips SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      await queryRunner.manager.query(querySQL, params);
      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${Payslip.name}.${this.findOne.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const querySQL = `TRUNCATE FROM payslips WHERE id = $1 CASCADE`;
      const params = [id];

      const [[payslip]]: [Payslip[]] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      if (!payslip) throw new NotFoundException('Payslip not found');

      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete payslip success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${PayslipService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

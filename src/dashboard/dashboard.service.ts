import { HistoryService } from 'src/history/history.service';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { DataSource, Repository } from 'typeorm';
import {
  DashboardStatisticDto,
  ListDashboardDto,
} from './dto/list-dashboard.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { History } from 'src/libs/entities/history.entity';
import { PayslipService } from 'src/payslip/payslip.service';

export class DashboardService {
  constructor(
    @InjectRepository(History)
    private readonly repository: Repository<History>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
    private readonly payslipService: PayslipService,
  ) {}
  async findAll(query: ListDashboardDto) {
    try {
      const startDate = new Date(
        `${query.date_attend_gte}T00:00:00.000`,
      ).toISOString();

      // Buat end date dengan waktu 23:59:59.999
      const nextDay = new Date(`${query.date_attend_lte}T00:00:00.000`);
      nextDay.setDate(nextDay.getDate() + 1); // Tambah 1 hari
      nextDay.setMilliseconds(nextDay.getMilliseconds() - 1); // Kurangi 1 milidetik

      const endDate = nextDay.toISOString();

      const [dataAttendDays] = await this.repository.query(
        `SELECT COUNT(*) as attendance_days
         FROM histories h
         LEFT JOIN employees e ON e.id = h.id_employee
         LEFT JOIN branches b ON b.id = e.id_branch
         WHERE h.deleted_at IS NULL AND e.id = $1 AND 
         h.type != 'KELUAR' AND
         h.date_attend BETWEEN $2 AND $3
         `,
        [query.id_employee, startDate, endDate],
      );

      const [dataSubmission] = await this.repository.query(
        `SELECT COUNT(*) as submission_days
         FROM histories h
         LEFT JOIN employees e ON e.id = h.id_employee
         LEFT JOIN branches b ON b.id = e.id_branch
         WHERE h.deleted_at IS NULL AND e.id = $1 AND 
         h.type != 'LEMBUR' AND
         h.type != 'MASUK' AND
         h.type != 'KELUAR' AND
         h.date_attend BETWEEN $2 AND $3`,
        [query.id_employee, startDate, endDate],
      );

      const attendDays = dataAttendDays['attendance_days'];

      const dateNow = new Date();

      const totalWorkingDays = await this.payslipService.countWorkingDays(
        new Date(startDate),
        new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, 0),
      );

      const absenceDays = totalWorkingDays - attendDays;

      // Format response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get dashboard success',
        data: {
          attendance_days: Number(attendDays),
          submission_days: Number(dataSubmission['submission_days']),
          absence_days: absenceDays,
          total_working_days: totalWorkingDays,
        },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${HistoryService.name}.${this.findAll.name}`,
      );
    }
  }

  async getTotalDataAdmin() {
    try {
      const [totalEmployee] = await this.repository.query(
        `SELECT COUNT(*) as total
         FROM employees WHERE deleted_at IS NULL`,
      );

      const [totalBranch] = await this.repository.query(
        `SELECT COUNT(*) as total
         FROM branches WHERE deleted_at IS NULL`,
      );

      const [totalDepartment] = await this.repository.query(
        `SELECT COUNT(*) as total
         FROM departments WHERE deleted_at IS NULL`,
      );

      const [totalSubmission] = await this.repository.query(
        `SELECT COUNT(*) as total 
         FROM submissions WHERE deleted_at IS NULL`,
      );

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get total data success',
        data: {
          total_employee: Number(totalEmployee['total']),
          total_branch: Number(totalBranch['total']),
          total_department: Number(totalDepartment['total']),
          total_submission: Number(totalSubmission['total']),
        },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${HistoryService.name}.${this.findAll.name}`,
      );
    }
  }

  async getDataInOutAdmin() {
    try {
      const [dataOut] = await this.repository.query(
        `SELECT COUNT(*) as total
         FROM histories WHERE deleted_at IS NULL
         AND type = 'KELUAR' AND date_attend >= CURRENT_DATE`,
      );

      const [dataIn] = await this.repository.query(
        `SELECT COUNT(*) as total
         FROM histories WHERE deleted_at IS NULL
         AND type != 'KELUAR' AND type != 'LEMBUR' AND date_attend >= CURRENT_DATE`,
      );

      const dataInOut = {
        total_out: Number(dataOut['total']),
        total_in: Number(dataIn['total']),
      };

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get total data success',
        data: dataInOut,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${HistoryService.name}.${this.findAll.name}`,
      );
    }
  }

  // Fungsi untuk geser urutan hari, mulai dari 6 hari lalu sampai hari ini
  async getRotatedDays() {
    const fullDayOrder = [
      'Minggu',
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      "Jum'at",
      'Sabtu',
    ];

    const todayIndex = new Date().getDay(); // 0: Minggu, 1: Senin, ..., 6: Sabtu
    const startIndex = (todayIndex + 1) % 7; // Hari setelah 6 hari lalu
    const result = [];

    for (let i = 0; i < 7; i++) {
      const index = (startIndex + i) % 7;
      result.push(fullDayOrder[index]);
    }

    return result;
  }

  async getDataStatisticAdmin(query: DashboardStatisticDto) {
    try {
      let queryStmt = '';

      if (query.type === 'weekly') {
        queryStmt = `SELECT 
        TO_CHAR(date_attend, 'Day') AS day_name,
        EXTRACT(DOW FROM date_attend) AS day_order,
        type,
        COUNT(*) as total
        FROM histories
        WHERE deleted_at IS NULL
        AND type != 'LEMBUR'
        AND date_attend >= CURRENT_DATE - INTERVAL '6 DAY'
        GROUP BY day_name, day_order, type
        ORDER BY day_order;
`;
      }

      if (query.type === 'monthly') {
        queryStmt = `SELECT 
        TO_CHAR(date_attend, 'DD-MM-YYYY') AS label, type,
        COUNT(*) as total
        FROM histories
        WHERE deleted_at IS NULL
        AND type != 'LEMBUR'
        AND date_attend >= CURRENT_DATE - INTERVAL '30 DAY'
        GROUP BY label, type
        ORDER BY MIN(date_attend) ASC;`;
      }

      const data = await this.repository.query(queryStmt);
      let finalData;
      console.log('DATA', data);

      if (query.type === 'weekly') {
        // Kelompokkan data berdasarkan hari
        const dayOrder: any = await this.getRotatedDays();

        const grouped = {};

        const dayNameMap = {
          Sunday: 'Minggu',
          Monday: 'Senin',
          Tuesday: 'Selasa',
          Wednesday: 'Rabu',
          Thursday: 'Kamis',
          Friday: "Jum'at",
          Saturday: 'Sabtu',
        };

        for (const day of dayOrder) {
          grouped[day] = { label: day, in_work: 0, absent_work: 0 };
        }

        for (const row of data) {
          const englishDay = row.day_name.trim();
          const label = dayNameMap[englishDay] || englishDay; // Hilangkan spasi
          if (!grouped[label]) {
            grouped[label] = { label, in_work: 0, absent_work: 0 };
          }

          if (row.type === 'MASUK') {
            grouped[label].in_work = parseInt(row.total);
          } else {
            grouped[label].absent_work = parseInt(row.total);
          }
        }

        finalData = Object.values(grouped);
        console.log('dataaa', finalData);
      }

      if (query.type === 'monthly') {
        const grouped = {};

        for (const row of data) {
          const label = row.label; // format "dd-MM-yyyy"

          if (!grouped[label]) {
            grouped[label] = { label, in_work: 0, absent_work: 0 };
          }

          console.log('row.type', row.type);

          if (row.type === 'MASUK') {
            grouped[label].in_work = parseInt(row.total);
          } else {
            grouped[label].absent_work = parseInt(row.total);
          }
        }

        finalData = Object.values(grouped);
        console.log('dataaa', finalData);
      }

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get total data success',
        data: finalData,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${HistoryService.name}.${this.findAll.name}`,
      );
    }
  }
}

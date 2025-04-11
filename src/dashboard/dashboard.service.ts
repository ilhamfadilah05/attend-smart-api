import { HistoryService } from 'src/history/history.service';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { DataSource, Repository } from 'typeorm';
import { ListDashboardDto } from './dto/list-dashboard.dto';
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
}

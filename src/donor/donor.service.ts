import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Donor } from 'src/libs/entities/donor.entity';
import { Repository } from 'typeorm';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListDonorDto } from './dto/list-donor.dto';

@Injectable()
export class DonorService {
  private static readonly DB_ENTITY = 'donors';
  private static readonly SELECTED_COLUMNS = [
    'id',
    'name',
    'email',
    'phone_number',
    'sandra_donor_id',
    'created_at',
    'updated_at',
  ];

  constructor(
    @InjectRepository(Donor)
    private readonly repository: Repository<Donor>,
    private readonly queryHelper: QueryHelper,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}

  async findAll(query: ListDonorDto) {
    try {
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      if (query.name) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(name) LIKE $${paramIndex}`);
        searchParams.push(`%${query.name.toLowerCase()}%`);
      }

      if (query.phone_number) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(phone_number) LIKE $${paramIndex}`);
        searchParams.push(`%${query.phone_number.toLowerCase()}%`);
      }

      if (query.created_at_gte) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`created_at >= $${paramIndex}`);
        searchParams.push(query.created_at_gte);
      }

      if (query.created_at_lte) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`created_at <= $${paramIndex}`);
        searchParams.push(query.created_at_lte);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `AND ${searchConditions.join(' AND ')}`
          : '';

      // sorting logic
      let sortClause = 'ORDER BY created_at ASC';
      if (query.sort_by) {
        const validSortColumns = ['name', 'phone_number', 'created_at'];

        // split the sort params
        const [column, order] = query.sort_by.split('-');

        // validate
        if (validSortColumns.includes(column)) {
          const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
          sortClause = `ORDER BY ${column} ${sortOrder}`;
        }
      }

      // Fetch donor query and parameters
      const fetchDonorsQuery = `
        SELECT ${DonorService.SELECTED_COLUMNS} 
        FROM ${DonorService.DB_ENTITY} 
        WHERE deleted_at IS NULL
        ${searchCondition}
        ${sortClause} 
        LIMIT $${searchParams.length + 1} 
        OFFSET $${searchParams.length + 2}
        `;
      const fetchDonorsParams = [...searchParams, limit, offset];

      // Count total configurations query and parameters
      const countDonorsQuery = `
        SELECT COUNT(*) as count 
        FROM ${DonorService.DB_ENTITY}
        WHERE deleted_at IS NULL ${searchCondition}
        `;
      const countDonorsParams = searchParams;

      // Execute queries
      const [donors, [totalDonors]]: [Donor[], { count: number }[]] =
        await Promise.all([
          this.repository.query(fetchDonorsQuery, fetchDonorsParams),
          this.repository.query(countDonorsQuery, countDonorsParams),
        ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get donor success',
        data: donors.map((donor) => ({
          id: donor.id,
          name: donor.name,
          email: donor.email,
          phone_number: donor.phone_number,
          sandra_donor_id: donor.sandra_donor_id,
          created_at: donor.created_at,
          updated_at: donor.updated_at,
        })),
        page: page,
        pageSize: limit,
        totalData: Number(totalDonors.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${DonorService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const [donor]: Donor[] = await this.repository.query(
        `SELECT ${DonorService.SELECTED_COLUMNS.join(', ')}
         FROM ${DonorService.DB_ENTITY}
         WHERE id = $1
         AND deleted_at IS NULL
         LIMIT 1`,
        [id],
      );

      if (!donor) throw new NotFoundException('Donor not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: donor.id,
          name: donor.name,
          email: donor.email,
          phone_number: donor.phone_number,
          sandra_donor_id: donor.sandra_donor_id,
          created_at: donor.created_at,
          updated_at: donor.updated_at,
        },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${DonorService.name}.${this.findOne.name}`,
      );
    }
  }
}

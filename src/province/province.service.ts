import { Injectable } from '@nestjs/common';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-province.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CityService } from 'src/city/city.service';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { Repository, DataSource } from 'typeorm';
import { Province } from 'src/libs/entities/province.entity';
import { ListProvincesDto } from './dto/list-province.dto';

@Injectable()
export class ProvinceService {
  constructor(
    @InjectRepository(Province)
    private readonly repository: Repository<Province>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}
  create(createProvinceDto: CreateProvinceDto) {
    return 'This action adds a new province';
  }

  async findAll(query: ListProvincesDto) {
    try {
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      const filter = this.queryHelper.search(
        [
          {
            param: 'name',
            column: 'name',
            operator: 'ILIKE',
          },
        ],
        {
          queryString: query,
          params: [limit, offset],
          created_at: {
            between: true,
            value: 'created_at',
          },
          delete: {
            isNull: true,
            value: 'deleted_at',
          },
        },
      );

      let orderBy = 'ORDER BY created_at DESC';

      if (query.sort_by) {
        const column = this.queryHelper.sort(query.sort_by, [
          'created_at',
          'name',
        ]);
        if (column !== undefined) {
          orderBy = `ORDER BY ${column}`;
        }
      }

      const [provinces, [countedProvinces]]: [Province[], { total: number }[]] =
        await Promise.all([
          this.repository.query(
            `SELECT id, name FROM provinces
            ${filter.where.q} 
            ${orderBy} 
            LIMIT $1 OFFSET $2`,
            filter.param.q,
          ),
          this.repository.query(
            `SELECT COUNT(*) as total FROM provinces ${filter.where.c}`,
            filter.param.c,
          ),
        ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: provinces,
        page: page,
        pageSize: limit,
        totalData: Number(countedProvinces.total),
      });
    } catch (error) {
      this.error.handleError(error, `${CityService.name}.${this.findAll.name}`);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} province`;
  }

  update(id: number, updateProvinceDto: UpdateProvinceDto) {
    return `This action updates a #${id} province`;
  }

  remove(id: number) {
    return `This action removes a #${id} province`;
  }
}

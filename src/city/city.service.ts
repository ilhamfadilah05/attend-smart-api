import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { Repository, DataSource } from 'typeorm';
import { City } from 'src/libs/entities/city.entity';
import { ListCityDto } from './dto/list-city.dto';

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(City)
    private readonly repository: Repository<City>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}
  async create(payload: CreateCityDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const city = new City();
      city.name = payload.name;

      const [province] = await queryRunner.manager.query(
        'SELECT id FROM provinces WHERE id = $1',
        [payload.province_id],
      );

      if (!province) throw new NotFoundException('Province not found');

      city.province.id = payload.province_id;

      await queryRunner.manager.save(city);

      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: city.id,
          name: city.name,
          created_at: city.created_at,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${CityService.name}.${this.create.name}`);
    } finally {
      queryRunner.release();
    }
  }

  async findAll(query: ListCityDto) {
    try {
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      const filter = this.queryHelper.search(
        [
          {
            param: 'name',
            column: 'c.name',
            operator: 'ILIKE',
          },
          {
            param: 'province',
            column: 'p.id',
            operator: '=',
          },
        ],
        {
          queryString: query,
          params: [limit, offset],
          created_at: {
            between: true,
            value: 'c.created_at',
          },
          delete: {
            isNull: true,
            value: 'c.deleted_at',
          },
        },
      );

      let orderBy = 'ORDER BY c.created_at DESC';

      if (query.sort_by) {
        const column = this.queryHelper.sort(query.sort_by, [
          'created_at',
          'name',
        ]);
        if (column !== undefined) {
          orderBy = `ORDER BY ${column}`;
        }
      }

      const [cities, [countedCities]]: [City[], { total: number }[]] =
        await Promise.all([
          this.repository.query(
            `SELECT c.id, c.name, 
              JSON_BUILD_OBJECT(
                'id', p.id,
                'name', p.name
              ) as province 
            FROM cities c JOIN provinces p ON p.id = c.province_id 
            ${filter.where.q} 
            ${orderBy} 
            LIMIT $1 OFFSET $2`,
            filter.param.q,
          ),
          this.repository.query(
            `SELECT COUNT(*) as total FROM cities c JOIN provinces p ON p.id = c.province_id ${filter.where.c}`,
            filter.param.c,
          ),
        ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: cities,
        page: page,
        pageSize: limit,
        totalData: Number(countedCities.total),
      });
    } catch (error) {
      this.error.handleError(error, `${CityService.name}.${this.findAll.name}`);
    }
  }

  async findOne(id: string) {
    try {
      const city = await this.repository.query(
        `SELECT c.id, c.name,
              JSON_BUILD_OBJECT(
                'id', p.id,
                'name', p.name
              ) as province 
            FROM cities c JOIN provinces p ON p.id = c.province_id WHERE id = $1 LIMIT 1`,
        [id],
      );

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: city,
      });
    } catch (error) {
      this.error.handleError(error, `${CityService.name}.${this.findOne.name}`);
    }
  }

  async update(id: string, payload: UpdateCityDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.commitTransaction();
    try {
      const [city] = (await queryRunner.manager.query(
        'SELECT id FROM cities WHERE id = $1',
        [id],
      )) as City[];

      if (!city) throw new NotFoundException('City not found');

      const { updateQuery, params } = this.queryHelper.update<{
        name: string;
        province_id: number;
      }>(id, {
        name: payload.name,
        province_id: payload.province_id,
      });

      const querySQL = `UPDATE cities SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      const [[updatedResult]] = (await queryRunner.manager.query(
        querySQL,
        params,
      )) as [City[]];

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Succes',
        data: updatedResult,
      });
    } catch (error) {
      this.error.handleError(error, `${CityService.name}.${this.update.name}`);
    } finally {
    }
  }

  remove(id: string) {
    return `This action removes a #${id} city`;
  }
}

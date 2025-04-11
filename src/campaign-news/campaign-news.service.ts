import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCampaignNewsDto } from './dto/create-campaign-news.dto';
import { UpdateCampaignNewsDto } from './dto/update-campaign-news.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CampaignNews } from 'src/libs/entities/campaign-news.entity';
import { DataSource, Repository } from 'typeorm';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListCampaignNewsDto } from 'src/campaign-news/dto/list-campaign-news.dto';

@Injectable()
export class CampaignNewsService {
  private static readonly DB_NAME = 'campaign_news';
  private static readonly DB_COLUMNS = [
    'id',
    'title',
    'description',
    'campaign_id',
    'created_at',
    'updated_at',
  ];

  constructor(
    @InjectRepository(CampaignNews)
    private readonly repository: Repository<CampaignNews>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}

  async create(payload: CreateCampaignNewsDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const campaign = await queryRunner.query(
        'SELECT id FROM campaigns WHERE id = $1',
        [payload.campaign_id],
      );
      if (!campaign || campaign.length === 0)
        throw new NotFoundException('Campaign id is not found');

      const campaignNews = queryRunner.manager.create(CampaignNews, {
        title: payload.title,
        description: payload.description,
        campaign_id: { id: payload.campaign_id },
      });

      await queryRunner.manager.save(campaignNews);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: campaign.id,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.error.handleError(error, CampaignNews.name);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListCampaignNewsDto) {
    try {
      // Pagination
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      // // Selected column
      // const SELECTED_COLUMN = [
      //   'id',
      //   'title',
      //   'description',
      //   'campaign_id',
      //   'created_at',
      //   'updated_at',
      // ];

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      if (query.title) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(title) LIKE $${paramIndex}`);
        searchParams.push(`%${query.title.toLowerCase()}%`);
      }

      if (query.description) {
        const paramIndex = searchParams.length + 1; // Calculate the next parameter index
        searchConditions.push(`LOWER(description) LIKE $${paramIndex}`);
        searchParams.push(`%${query.description.toLowerCase()}%`);
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

      if (query.campaign_id) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`campaign_id = $${paramIndex}`);
        searchParams.push(query.campaign_id);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `AND ${searchConditions.join(' AND ')}`
          : '';

      // sorting logic
      let sortClause = 'ORDER BY created_at ASC';
      if (query.sort_by) {
        const validSortColumns = ['title', 'description'];

        // split the sort params
        const [column, order] = query.sort_by.split('-');

        // validate
        if (validSortColumns.includes(column)) {
          const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
          sortClause = `ORDER BY ${column} ${sortOrder}`;
        }
      }

      // Fetch campaign news query and parameters
      const fetchCampaignNewsQuery = `
        SELECT ${CampaignNewsService.DB_COLUMNS.join(', ')} 
        FROM ${CampaignNewsService.DB_NAME} 
        WHERE deleted_at IS NULL ${searchCondition}
        ${sortClause} 
        LIMIT $${searchParams.length + 1} 
        OFFSET $${searchParams.length + 2}
      `;
      const fetchCampaignNewsParams = [...searchParams, limit, offset];

      // Count total campaign news query and parameters
      const countCampaignNewsQuery = `
        SELECT COUNT(*) as count 
        FROM ${CampaignNewsService.DB_NAME} 
        WHERE deleted_at IS NULL ${searchCondition}
      `;
      const countCampaignNewsParams = searchParams;

      // Execute queries
      const [campaignNews, [totalCampaignNews]]: [
        CampaignNews[],
        { count: number }[],
      ] = await Promise.all([
        this.repository.query(fetchCampaignNewsQuery, fetchCampaignNewsParams),
        this.repository.query(countCampaignNewsQuery, countCampaignNewsParams),
      ]);

      // Format response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get campaign news success',
        data: campaignNews.map((campaignNews) => ({
          id: campaignNews.id,
          title: campaignNews.title,
          description: campaignNews.description,
          campaign_id: campaignNews.campaign_id,
          created_at: campaignNews.created_at,
          updated_at: campaignNews.updated_at,
        })),
        page: page,
        pageSize: limit,
        totalData: Number(totalCampaignNews.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${CampaignNewsService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      // database queries
      const [campaignNews]: CampaignNews[] = await this.repository.query(
        `
        SELECT ${CampaignNewsService.DB_COLUMNS.join(', ')}
        FROM ${CampaignNewsService.DB_NAME}
        WHERE deleted_at IS NULL
        AND id = $1
        LIMIT 1
        `,
        [id],
      );

      if (!campaignNews) {
        throw new NotFoundException('Campaign news not found');
      }

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: campaignNews.id,
          title: campaignNews.title,
          description: campaignNews.description,
          campaign_id: campaignNews.campaign_id,
          created_at: campaignNews.created_at,
          updated_at: campaignNews.updated_at,
        },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${CampaignNewsService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(id: string, payload: UpdateCampaignNewsDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // check if campaign news exist
      const campaignNews = await queryRunner.query(
        `SELECT id FROM ${CampaignNewsService.DB_NAME} WHERE id = $1`,
        [id],
      );

      if (!campaignNews || campaignNews.length === 0) {
        throw new NotFoundException('Campaign news not found');
      }

      // update query dynamically
      const { updateQuery, params } = this.queryHelper.update<
        Partial<CampaignNews>
      >(id, {
        title: payload.title,
        description: payload.description,
      });

      // execute query
      await queryRunner.query(
        `
        UPDATE ${CampaignNewsService.DB_NAME}
        SET ${updateQuery}
        WHERE id = $${params.length}
        RETURNING *
        `,
        params,
      );
      await queryRunner.commitTransaction();

      // return formatted response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
      });
    } catch (error) {
      // rollback transaction in case of error
      await queryRunner.rollbackTransaction();

      // handle and log the error
      this.error.handleError(
        error,
        `${CampaignNewsService.name}.${this.findOne.name}`,
      );
    } finally {
      // release query runner
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const params = [new Date(), id];

      const result = await queryRunner.query(
        `
        UPDATE ${CampaignNewsService.DB_NAME}
        SET deleted_at = $1
        WHERE id = $2
        AND deleted_at IS NULL
        RETURNING *
        `,
        params,
      );

      if (!result || result.length === 0) {
        throw new NotFoundException('Campaign news not found');
      }

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete campaign news success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.error.handleError(error, `${CampaignNews.name}.${this.remove.name}`);
    } finally {
      await queryRunner.release();
    }
  }
}

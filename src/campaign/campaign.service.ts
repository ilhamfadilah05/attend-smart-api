import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CAMPAIGN_TYPE, CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { Campaign } from 'src/libs/entities/campaign.entity';
import { DataSource, Repository } from 'typeorm';
import { IJwtPayload, IUpdateCampaign } from 'src/libs/interface';
import { GoogleCloudStorage } from 'src/libs/service/gcs/google-cloud-storage.service';
import { ListCampaignDto } from './dto/list-campaign.dto';
import { v4 as uuid } from 'uuid';
import { FUND_TYPE } from 'src/libs/constant';
import { CategoryService } from 'src/category/category.service';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly repository: Repository<Campaign>,
    private dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
    private readonly queryHelper: QueryHelper,
    private readonly gcs: GoogleCloudStorage,
    private readonly categoryService: CategoryService,
  ) {}

  async checkSlug(slug: string) {
    try {
      const [campaign] = await this.repository.query(
        'SELECT slug FROM campaigns WHERE slug = $1',
        [slug],
      );

      if (!campaign) throw new NotFoundException('Slug not found');
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { slug },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${CampaignService.name}.${this.checkSlug.name}`,
      );
    }
  }

  async create(
    payload: CreateCampaignDto,
    user: IJwtPayload,
    image: Express.Multer.File,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let imageName = '';

    try {
      const promises = [
        queryRunner.query('SELECT slug FROM campaigns WHERE slug = $1', [
          payload.slug,
        ]),
      ];
      if (!image) {
        throw new BadRequestException('Image is required');
      }

      const additional = {};

      if (payload.campaign_group_id) {
        additional['campaignGroupId'] = promises.length;
        promises.push(
          queryRunner.query('SELECT name FROM campaign_groups WHERE id = $1', [
            payload.campaign_group_id,
          ]),
        );
      }

      if (payload.city_id) {
        additional['cityId'] = promises.length;
        promises.push(
          queryRunner.query('SELECT name FROM cities WHERE id = $1 LIMIT 1', [
            payload.city_id,
          ]),
        );
      }

      if (payload.category) {
        additional['category'] = promises.length;
        promises.push(this.categoryService.findOne(payload.category));
      }

      const tasksResult = (await Promise.all(promises)) as [[Campaign]];

      if (tasksResult[0][0])
        throw new ConflictException(`Slug  already exists`);

      if (
        payload.campaign_group_id &&
        !tasksResult[additional['campaignGroupId']][0]
      )
        throw new NotFoundException('Campaign group is not found');

      if (payload.city_id && !tasksResult[additional['cityId']][0])
        throw new NotFoundException('City is not found');

      if (payload.category && !tasksResult[additional['category']])
        throw new NotFoundException('Category is not found');

      imageName = uuid() + '.' + image.mimetype.split('/')[1];
      const imageUrl = await this.gcs.uploadFile({
        bucketName: process.env.STORAGE_BUCKET_NAME,
        destination: process.env.NODE_ENV,
        fileName: imageName,
        multerFile: image,
      });

      let campaign: Partial<Campaign> = {};
      if (
        payload.type === FUND_TYPE.KEMANUSIAAN ||
        payload.type == FUND_TYPE.WAKAF
      ) {
        campaign = queryRunner.manager.create(Campaign, {
          name: payload.name,
          type: payload.type,
          slug: payload.slug,
          is_highlighted: payload.is_highlighted ?? false,
          campaignGroup: { id: payload.campaign_group_id ?? null },
          target_date: payload.target_date ?? null,
          description: payload.description,
          campaign_target: payload.campaign_target ?? 0,
          city: { id: payload.city_id ?? null },
          category: payload.category,
          createdBy: { id: user.id },
          current_funds: payload.campaign_target,
          is_publish: payload.is_publish ?? false,
          image: imageUrl,
          sandra_project_uuid: payload.sandra_project_uuid ?? null,
          sandra_program_uuid: payload.sandra_program_uuid ?? null,
        });
      }

      if (payload.type === FUND_TYPE.KURBAN) {
        campaign = queryRunner.manager.create(Campaign, {
          name: payload.name,
          type: payload.type,
          slug: payload.slug,
          campaignGroup: { id: payload.campaign_group_id ?? null },
          city: { id: payload.city_id ?? null },
          target_date: payload.target_date ?? null, // deadline qurban
          description: payload.description,
          category: payload.category,
          createdBy: { id: user.id },
          current_funds: payload.campaign_target,
          is_publish: payload.is_publish ?? false, // in stock or out of stock
          image: imageUrl,
          price: payload.price, // required
          discount_price: payload.discount_price,
          max_weight: payload.max_weight, // required
          min_weight: payload.min_weight, // required
          stock: payload.stock, // required
          max_profile_names: payload.max_profile_names, // required
          sandra_project_uuid: payload.sandra_project_uuid ?? null,
          sandra_program_uuid: payload.sandra_program_uuid ?? null,
          thk_livestock_campaign_uuid:
            payload.thk_livestock_campaign_uuid ?? null,
        });
      }

      await queryRunner.manager.save(campaign);
      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Create campaign success',
        data: {
          id: campaign.id,
          name: campaign.name,
          slug: campaign.slug,
          type: campaign.type,
          created_at: campaign.created_at,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (imageName.length > 0) {
        this.gcs
          .checkFileExists({
            bucketName: process.env.STORAGE_BUCKET_NAME,
            destination: process.env.NODE_ENV,
            fileName: imageName,
          })
          .then((exists) => {
            if (exists) {
              this.gcs
                .removeFile({
                  bucketName: process.env.STORAGE_BUCKET_NAME,
                  destination: process.env.NODE_ENV,
                  fileName: imageName,
                })
                .catch((error) => {
                  console.log('Failed remove\n', error);
                });
            }
          })
          .catch(() => {
            console.log(`ERROR: ${CampaignService.name}.${this.create.name}\n`);
          });
      }

      this.error.handleError(
        error,
        `${CampaignService.name}.${this.create.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListCampaignDto) {
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
            param: 'type',
            column: 'c.type',
            operator: '=',
            enum: Object.values(CAMPAIGN_TYPE),
          },
          {
            param: 'slug',
            column: 'c.slug',
            operator: 'ILIKE',
          },
          {
            param: 'publish',
            column: 'c.is_publish',
            operator: '=',
          },
          {
            param: 'target_date',
            column: 'c.target_date',
            operator: '=',
          },
          {
            param: 'campaign_target_gte',
            column: 'c.campaign_target',
            operator: '>=',
          },
          {
            param: 'campaign_target_lte',
            column: 'c.campaign_target',
            operator: '<=',
          },
          {
            param: 'current_funds_gte',
            column: 'c.current_funds',
            operator: '>=',
          },
          {
            param: 'current_funds_lte',
            column: 'c.current_funds',
            operator: '<=',
          },
        ],
        {
          queryString: query,
          params: [limit, offset],
          delete: { isNull: true, value: 'c.deleted_at' },
          created_at: { between: true, value: 'c.created_at' },
        },
      );

      let orderBy = 'ORDER BY c.created_at DESC';

      if (query.sort_by) {
        const column = this.queryHelper.sort(query.sort_by, [
          'c.created_at',
          'c.name',
          'c.slug',
          'c.is_publish',
          'c.type',
          'c.stock',
          'c.current_funds',
          'c.campaign_target',
        ]);

        if (column !== undefined) {
          orderBy = `ORDER BY ${column}`;
        }
      }

      // mandatory where clause
      const mandatoryWhereClauses =
        "type IN ('kemanusiaan', 'wakaf', 'kurban')";
      filter.where.q +=
        filter.where.q.length > 0
          ? ` AND ${mandatoryWhereClauses}`
          : `WHERE ${mandatoryWhereClauses}`;
      filter.where.c +=
        filter.where.c.length > 0
          ? ` AND ${mandatoryWhereClauses}`
          : `WHERE ${mandatoryWhereClauses}`;

      const [campaigns, [totalCampaigns]]: [Campaign[], { count: number }[]] =
        await Promise.all([
          this.repository.query(
            `SELECT c.id, c.name, c.slug, c.type, c.created_at, c.is_publish, c.stock, c.campaign_target, c.current_funds, c.updated_at, u.name as user_name FROM campaigns c JOIN users u ON u.id = c.created_by_id ${filter.where.q} ${orderBy} LIMIT $1 OFFSET $2`,
            filter.param.q,
          ),
          this.repository.query(
            `SELECT COUNT(*) as count FROM campaigns c JOIN users u ON u.id = c.created_by_id ${filter.where.c}`,
            filter.param.c,
          ),
        ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get campaign success',
        data: campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          slug: c.slug,
          stock: c.stock,
          is_publish: c.is_publish,
          campaign_target: c.campaign_target,
          current_funds: c.current_funds,
          created_by: c['user_name'],
          created_at: c.created_at,
          updated_at: c.updated_at,
        })),
        page: page,
        pageSize: limit,
        totalData: Number(totalCampaigns.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${CampaignService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const [campaign] = (await this.repository.query(
        `SELECT c.id, c.name, c.type, c.slug, c.description, c.campaign_group_id, c.is_publish, c.category, c.campaign_target, c.target_date, c.is_highlighted, c.discount_price,
        c.current_funds, c.image, c.price, c.stock, c.max_weight, c.min_weight, c.sandra_project_uuid, c.sandra_program_uuid, c.thk_livestock_campaign_uuid,c.max_profile_names,
        CASE 
            WHEN ct.id IS NOT NULL 
            THEN jsonb_build_object(
                'id', ct.id,
                'name', ct.name
            )
            ELSE NULL
        END AS city,
        CASE 
            WHEN p.id IS NOT NULL 
            THEN jsonb_build_object(
                'id', p.id,
                'name', p.name
            )
            ELSE NULL
        END AS province,
        u.name as created_by, c.created_at, c.updated_at
        FROM campaigns c 
        JOIN users u ON c.created_by_id = u.id 
        LEFT JOIN cities ct ON ct.id = c.city_id
        LEFT JOIN provinces p ON p.id = ct.province_id
        WHERE c.id = $1 AND c.deleted_at IS NULL`,
        [id],
      )) as Campaign[];

      if (!campaign) throw new NotFoundException('Campaign not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: campaign,
      });
    } catch (error) {
      this.error.handleError(error, `${Campaign.name}.${this.findOne.name}`);
    }
  }

  async update(
    id: string,
    payload: UpdateCampaignDto,
    image: Express.Multer.File,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';
    try {
      const [currentCampaign] = (await queryRunner.manager.query(
        'SELECT id, slug, image FROM campaigns WHERE id = $1',
        [id],
      )) as Campaign[];

      if (!currentCampaign) throw new NotFoundException('Campaign not found');

      const parallelTasks = [
        queryRunner.query('SELECT slug FROM campaigns WHERE slug = $1', [
          payload.slug,
        ]),
      ];

      const additional = {};

      if (payload.campaign_group_id) {
        additional['campaignGroupId'] = parallelTasks.length;
        parallelTasks.push(
          queryRunner.query('SELECT name FROM campaign_groups WHERE id = $1', [
            payload.campaign_group_id,
          ]),
        );
      }

      if (payload.city_id) {
        additional['cityId'] = parallelTasks.length;
        parallelTasks.push(
          queryRunner.query('SELECT name FROM cities WHERE id = $1 LIMIT 1', [
            payload.city_id,
          ]),
        );
      }

      const tasksResult = (await Promise.all(parallelTasks)) as [[Campaign]];

      if (tasksResult[0][0] && tasksResult[0][0].id === id)
        throw new ConflictException('Slug already exist');

      if (
        payload.campaign_group_id &&
        !tasksResult[additional['campaignGroupId']][0]
      )
        throw new NotFoundException('Campaign group is not found');

      if (payload.city_id && !tasksResult[additional['cityId']][0])
        throw new NotFoundException('City is not found');

      let imageUrl: string = '';

      if (image) {
        imageName = uuid() + '.' + image.mimetype.split('/')[1];
        imageUrl = await this.gcs.uploadFile({
          bucketName: process.env.STORAGE_BUCKET_NAME,
          destination: process.env.NODE_ENV,
          fileName: imageName,
          multerFile: image,
        });
      }

      if (payload.slug === currentCampaign.slug) {
        payload.slug = undefined;
      }

      let campaign: IUpdateCampaign = {};
      if (
        payload.type === FUND_TYPE.KEMANUSIAAN ||
        payload.type == FUND_TYPE.WAKAF
      ) {
        campaign = {
          name: payload.name,
          type: payload.type,
          slug: payload.slug,
          is_highlighted: payload.is_highlighted,
          campaign_group_id: payload.campaign_group_id,
          campaign_target: payload.campaign_target ?? null,
          target_date: payload.target_date
            ? new Date(payload.target_date)
            : null,
          description: payload.description,
          city_id: payload.city_id,
          category: payload.category,
          is_publish: payload.is_publish,
          image: imageUrl,
          sandra_project_uuid: payload.sandra_project_uuid ?? null,
          sandra_program_uuid: payload.sandra_program_uuid ?? null,
        };
      }

      if (payload.type === FUND_TYPE.KURBAN) {
        campaign = {
          name: payload.name,
          type: payload.type,
          slug: payload.slug,
          is_highlighted: payload.is_highlighted,
          campaign_group_id: payload.campaign_group_id,
          target_date: payload.target_date
            ? new Date(payload.target_date)
            : null, // deadline qurban
          description: payload.description,
          city_id: payload.city_id,
          category: payload.category,
          is_publish: payload.is_publish, // in stock or out of stock
          image: imageUrl,
          price: payload.price, // required
          discount_price: payload.discount_price,
          max_weight: payload.max_weight, // required
          min_weight: payload.min_weight, // required
          stock: payload.stock, // required
          max_profile_names: payload.max_profile_names, // required
          sandra_project_uuid: payload.sandra_project_uuid ?? null,
          sandra_program_uuid: payload.sandra_program_uuid ?? null,
          thk_livestock_campaign_uuid:
            payload.thk_livestock_campaign_uuid ?? null,
        };
      }

      const { updateQuery, params } = this.queryHelper.update<IUpdateCampaign>(
        id,
        campaign,
        ['target_date', 'campaign_target'],
      );

      const querySQL = `UPDATE campaigns SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      const [[updatedResult]] = (await queryRunner.manager.query(
        querySQL,
        params,
      )) as [Campaign[]];

      if (image) {
        this.gcs
          .checkFileExists({
            bucketName: process.env.STORAGE_BUCKET_NAME,
            destination: process.env.NODE_ENV,
            fileName: this.gcs.extractFileName(currentCampaign.image),
          })
          .then((exists) => {
            if (exists) {
              this.gcs
                .removeFile({
                  bucketName: process.env.STORAGE_BUCKET_NAME,
                  destination: process.env.NODE_ENV,
                  fileName: this.gcs.extractFileName(currentCampaign.image),
                })
                .catch((error) => {
                  console.log(`GSC : remove file error\n`, error);
                });
            }
          })
          .catch((error) =>
            console.log(`ERROR ${this.gcs.checkFileExists.name}\n`, error),
          );
      }

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Success',
        data: {
          id: updatedResult.id,
          name: updatedResult.name,
          slug: updatedResult.slug,
          type: updatedResult.type,
          created_at: updatedResult.created_at,
          updated_at: updatedResult.updated_at,
        },
      });
    } catch (error) {
      if (imageName.length > 0) {
        this.gcs
          .checkFileExists({
            bucketName: process.env.STORAGE_BUCKET_NAME,
            destination: process.env.NODE_ENV,
            fileName: imageName,
          })
          .then((exists) => {
            if (exists) {
              this.gcs
                .removeFile({
                  bucketName: process.env.STORAGE_BUCKET_NAME,
                  destination: process.env.NODE_ENV,
                  fileName: imageName,
                })
                .catch((error) => {
                  console.log('Failed to remove\n', error);
                });
            }
          })
          .catch((error) => {
            console.log(
              `ERROR: ${CampaignService.name}.${this.update.name}\n`,
              error,
            );
          });
      }
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${Campaign.name}.${this.update.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const querySQL = `UPDATE campaigns SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING *`;
      const params = [new Date(), id];

      const [[campaign]]: [Campaign[]] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      if (!campaign) throw new NotFoundException('Campaign not found');
      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete campaign group success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${CampaignService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

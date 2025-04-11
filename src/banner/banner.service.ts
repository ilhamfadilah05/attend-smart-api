import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Banner } from 'src/libs/entities/banner.entity';
import { DataSource, Repository } from 'typeorm';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListBannerDto } from './dto/list-banner.dto';
import { GoogleCloudStorage } from 'src/libs/service/gcs/google-cloud-storage.service';
import { BANNER_TYPE } from 'src/libs/constant';
import { isURL } from 'class-validator';
import { v4 as uuid } from 'uuid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class BannerService {
  private readonly cachePrefix = process.env.CACHE_PREFIX + ':banner';
  private static readonly DB_NAME = 'banners';
  private static readonly DB_COLUMNS = [
    'id',
    'type',
    'value',
    'is_publish',
    'position_order',
    'image',
    'created_at',
    'updated_at',
  ];

  constructor(
    @InjectRepository(Banner)
    private readonly repository: Repository<Banner>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
    private readonly gcs: GoogleCloudStorage,
  ) {}

  async create(payload: CreateBannerDto, image: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let imageName = '';

    try {
      // check for image
      if (!image) throw new BadRequestException('Image is required');

      // validate position_order availability
      const [existingBanner] = await queryRunner.query(
        `
        SELECT position_order
        FROM ${BannerService.DB_NAME} 
        WHERE position_order = $1
        LIMIT 1
        `,
        [payload.position_order],
      );

      if (existingBanner) {
        throw new BadRequestException('Position order already filled');
      }

      // validate payload type and value
      if (payload.type === BANNER_TYPE.CAMPAIGN) {
        const [campaign] = await queryRunner.query(
          `
          SELECT slug
          FROM campaigns 
          WHERE slug = $1
          LIMIT 1
          `,
          [payload.value],
        );

        if (!campaign) {
          throw new NotFoundException('Campaign slug is not found');
        }
      } else if (!isURL(payload.value)) {
        throw new BadRequestException('Value is not a valid URL');
      }

      imageName = uuid() + '.' + image.mimetype.split('/')[1];

      const imageUrl = await this.gcs.uploadFile({
        bucketName: process.env.STORAGE_BUCKET_NAME,
        destination: process.env.NODE_ENV,
        fileName: imageName,
        multerFile: image,
      });

      const banner = queryRunner.manager.create(Banner, {
        type: payload.type,
        value: payload.value,
        is_publish: payload.is_publish,
        position_order: payload.position_order,
        image: imageUrl,
      });

      await queryRunner.manager.save(banner);
      await queryRunner.commitTransaction();
      this.cacheManager
        .del(`${this.cachePrefix}:all`)
        .catch((error) => console.log('failed delete cache', error));

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Create banner success',
        data: {
          id: banner.id,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // remove image from gcs
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
            console.log(`ERROR: ${BannerService.name}.${this.create.name}\n`);
          });
      }

      this.error.handleError(error, BannerService.name);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListBannerDto) {
    try {
      // Pagination
      const { limit, page, offset } = this.queryHelper.pagination(
        query.page,
        query.limit,
      );

      // Search conditions and parameters
      const searchConditions: string[] = [];
      const searchParams: any[] = [];

      if (query.type) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`type = $${paramIndex}`);
        searchParams.push(query.type);
      }

      if (query.value) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(value) LIKE $${paramIndex}`);
        searchParams.push(`%${query.type.toLowerCase()}%`);
      }

      if (query.is_publish !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`is_publish = $${paramIndex}`);
        searchParams.push(query.is_publish);
      }

      if (query.position_order) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`position_order = $${paramIndex}`);
        searchParams.push(query.position_order);
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

      // Sorting logic
      let sortClause = 'ORDER BY position_order ASC';
      if (query.sort_by) {
        const validSortColumns = [
          'type',
          'value',
          'position_order',
          'created_at',
        ];

        // Split the sort params
        const [column, order] = query.sort_by.split('-');

        // Validate
        if (validSortColumns.includes(column)) {
          const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
          sortClause = `ORDER BY ${column} ${sortOrder}`;
        }
      }

      // Fetch banners query and parameters
      const fetchBannersQuery = `
        SELECT ${BannerService.DB_COLUMNS.join(', ')}
        FROM ${BannerService.DB_NAME}
        WHERE deleted_at IS NULL
        ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchBannersParams = [...searchParams, limit, offset];

      // Count total banners query and parameters
      const countBannersQuery = `
        SELECT COUNT(*) as count
        FROM ${BannerService.DB_NAME}
        WHERE deleted_at IS NULL
        ${searchCondition}
      `;
      const countBannersParams = searchParams;

      // Execute queries
      const [banners, [totalBanners]]: [Banner[], { count: number }[]] =
        await Promise.all([
          this.repository.query(fetchBannersQuery, fetchBannersParams),
          this.repository.query(countBannersQuery, countBannersParams),
        ]);

      // Format response
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get banner success',
        data: banners.map((banner) => ({
          id: banner.id,
          type: banner.type,
          value: banner.value,
          is_publish: banner.is_publish,
          position_order: banner.position_order,
          image: banner.image,
          created_at: banner.created_at,
          updated_at: banner.updated_at,
        })),
        page: page,
        pageSize: limit,
        totalData: Number(totalBanners.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${BannerService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      // database queries
      const [banner]: Banner[] = await this.repository.query(
        `
        SELECT ${BannerService.DB_COLUMNS.join(', ')}
        FROM ${BannerService.DB_NAME}
        WHERE deleted_at IS NULL
        AND id = $1
        LIMIT 1
        `,
        [id],
      );

      if (!banner) {
        throw new NotFoundException('Banner not found');
      }

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: banner.id,
          type: banner.type,
          value: banner.value,
          is_publish: banner.is_publish,
          position_order: banner.position_order,
          image: banner.image,
          created_at: banner.created_at,
          updated_at: banner.updated_at,
        },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${BannerService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(
    id: string,
    payload: UpdateBannerDto,
    image: Express.Multer.File,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';

    try {
      // fetch the current banner and validate position_order
      const [currentBanner] = await queryRunner.query(
        `
        SELECT ${BannerService.DB_COLUMNS.join(', ')}
        FROM ${BannerService.DB_NAME}
        WHERE id = $1
        AND position_order <> $2
        LIMIT 1
        `,
        [id, payload.position_order],
      );

      if (!currentBanner) {
        throw new NotFoundException('Banner not found');
      }

      // validate payload type and value
      if (payload.type === BANNER_TYPE.CAMPAIGN) {
        const [campaign] = await queryRunner.query(
          `
          SELECT slug
          FROM campaigns
          WHERE slug = $1
          LIMIT 1
          `,
          [payload.value],
        );

        if (!campaign) {
          throw new NotFoundException('Campaign slug is not found');
        }
      } else if (!isURL(payload.value)) {
        throw new BadRequestException('Value is not a valid URL');
      }

      let imageUrl = '';

      if (image) {
        imageName = uuid() + '.' + image.mimetype.split('/')[1];
        imageUrl = await this.gcs.uploadFile({
          bucketName: process.env.STORAGE_BUCKET_NAME,
          destination: process.env.NODE_ENV,
          fileName: imageName,
          multerFile: image,
        });
      }

      const newBanner = queryRunner.manager.create(Banner, {
        type: payload.type,
        value: payload.value,
        is_publish: payload.is_publish,
        position_order: payload.position_order,
        image: imageUrl,
      });

      const { updateQuery, params } = this.queryHelper.update<Partial<Banner>>(
        id,
        newBanner,
      );

      await queryRunner.manager.query(
        `
        UPDATE ${BannerService.DB_NAME}
        SET ${updateQuery}
        WHERE id = $${params.length}
        RETURNING *
        `,
        params,
      );

      if (image) {
        this.gcs
          .checkFileExists({
            bucketName: process.env.STORAGE_BUCKET_NAME,
            destination: process.env.NODE_ENV,
            fileName: this.gcs.extractFileName(currentBanner.image),
          })
          .then(() => {
            this.gcs
              .removeFile({
                bucketName: process.env.STORAGE_BUCKET_NAME,
                destination: process.env.NODE_ENV,
                fileName: this.gcs.extractFileName(currentBanner.image),
              })
              .catch((error) => {
                console.log(`GSC : remove file error\n`, error);
              });
          });
      }

      await queryRunner.commitTransaction();
      this.cacheManager
        .del(`${this.cachePrefix}:all`)
        .catch((error) => console.log('failed delete cache', error));

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Update banner success',
        data: {
          id,
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
          .catch(() => {
            console.log(`ERROR: ${BannerService.name}.${this.update.name}\n`);
          });
      }
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${BannerService.name}.${this.update.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const params = [new Date(), id];
      const result: Banner = await queryRunner.manager.query(
        `
        UPDATE ${BannerService.DB_NAME}
        SET deleted_at = $1
        WHERE id = $2
        AND deleted_at IS NULL
        RETURNING *
        `,
        params,
      );

      if (!result) {
        throw new NotFoundException('Banner not found');
      }

      await queryRunner.commitTransaction();
      this.cacheManager
        .del(`${this.cachePrefix}:all`)
        .catch((error) => console.log('failed delete cache', error));

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete banner success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.error.handleError(
        error,
        `${BannerService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

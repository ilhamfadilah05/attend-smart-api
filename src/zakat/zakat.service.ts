import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateZakatDto } from './dto/update-zakat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Campaign } from 'src/libs/entities/campaign.entity';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { GoogleCloudStorage } from 'src/libs/service/gcs/google-cloud-storage.service';
import { Repository, DataSource } from 'typeorm';
import { ListZakatDto } from './dto/list-zakat.dto';
import { v4 as uuid } from 'uuid';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class ZakatService {
  private readonly cachePrefix = process.env.CACHE_PREFIX + ':zakat';
  constructor(
    @InjectRepository(Campaign)
    private readonly repository: Repository<Campaign>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
    private readonly queryHelper: QueryHelper,
    private readonly gcs: GoogleCloudStorage,
  ) {}

  async findAll(query: ListZakatDto) {
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
            param: 'slug',
            column: 'c.slug',
            operator: 'ILIKE',
          },
          {
            param: 'publish',
            column: 'c.is_publish',
            operator: '=',
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
          'c.publish',
          'c.slug',
          'c.current_funds',
        ]);

        if (column !== undefined) {
          orderBy = `ORDER BY ${column}`;
        }
      }

      const [zakats, [totalZakats]]: [Campaign[], { count: number }[]] =
        await Promise.all([
          this.repository.query(
            `SELECT c.id, c.name, c.slug, c.type, c.created_at, c.is_publish, c.stock, 
            c.campaign_target, c.current_funds, c.updated_at, u.name as user_name 
            FROM campaigns c 
            JOIN users u ON u.id = c.created_by_id 
            ${filter.where.q} AND type = 'zakat'
            ${orderBy} 
            LIMIT $1 OFFSET $2`,
            filter.param.q,
          ),
          this.repository.query(
            `SELECT COUNT(*) as count FROM campaigns c JOIN users u ON u.id = c.created_by_id ${filter.where.c} AND type = 'zakat'`,
            filter.param.c,
          ),
        ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get zakat success',
        data: zakats.map((zakat) => ({
          id: zakat.id,
          name: zakat.name,
          type: zakat.type,
          slug: zakat.slug,
          stock: zakat.stock,
          is_publish: zakat.is_publish,
          campaign_target: zakat.campaign_target,
          current_funds: zakat.current_funds,
          created_by: zakat['user_name'],
          created_at: zakat.created_at,
          updated_at: zakat.updated_at,
        })),
        page: page,
        pageSize: limit,
        totalData: Number(totalZakats.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${ZakatService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const [zakat] = (await this.repository.query(
        `SELECT c.id, c.name, c.slug, c.description, c.is_publish, c.current_funds, c.image,c.sandra_project_uuid, c.sandra_program_uuid, c.created_at, c.updated_at
            FROM campaigns c 
            JOIN users u ON c.created_by_id = u.id 
            WHERE c.id = $1 AND c.deleted_at IS NULL`,
        [id],
      )) as Campaign[];

      const zakats = ['fidyah', 'fitrah', 'maal', 'emas', 'penghasilan'];

      if (!zakats.includes(zakat.slug)) {
        throw new NotFoundException('Zakat not found');
      }

      if (!zakat) throw new NotFoundException('Zakat not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: zakat,
      });
    } catch (error) {
      this.error.handleError(error, `${Campaign.name}.${this.findOne.name}`);
    }
  }

  async update(
    id: string,
    payload: UpdateZakatDto,
    image: Express.Multer.File,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';
    try {
      let imageUrl: string = '';

      const [currentZakat] = (await queryRunner.manager.query(
        'SELECT id, slug, image FROM campaigns WHERE id = $1',
        [id],
      )) as Campaign[];

      if (!currentZakat) throw new NotFoundException('Zakat not found');

      if (image) {
        imageName = uuid() + '.' + image.mimetype.split('/')[1];
        imageUrl = await this.gcs.uploadFile({
          bucketName: process.env.STORAGE_BUCKET_NAME,
          destination: process.env.NODE_ENV,
          fileName: imageName,
          multerFile: image,
        });
      }

      const zakat = {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        is_publish: payload.is_publish,
        image: imageUrl,
        sandra_project_uuid: payload.sandra_project_uuid ?? null,
        sandra_program_uuid: payload.sandra_program_uuid ?? null,
      };

      const { updateQuery, params } = this.queryHelper.update<any>(id, zakat);

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
            fileName: this.gcs.extractFileName(currentZakat.image),
          })
          .then(() => {
            this.gcs
              .removeFile({
                bucketName: process.env.STORAGE_BUCKET_NAME,
                destination: process.env.NODE_ENV,
                fileName: this.gcs.extractFileName(currentZakat.image),
              })
              .catch((error) => {
                console.log(`GSC : remove file error\n`, error);
              });
          });
      }

      await queryRunner.commitTransaction();
      this.cacheManager
        .del(`${this.cachePrefix}:${updatedResult.slug}`)
        .catch((error) => console.log('failed delete cache', error));

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
          .catch(() => {
            console.log(`ERROR: ${ZakatService.name}.${this.update.name}\n`);
          });
      }
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${Campaign.name}.${this.findOne.name}`);
    } finally {
      await queryRunner.release();
    }
  }
}

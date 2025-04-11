import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Menu } from 'src/libs/entities/menu.entity';
import { DataSource, Repository } from 'typeorm';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListMenuDto } from './dto/list-menu.dto';
import { GoogleCloudStorage } from 'src/libs/service/gcs/google-cloud-storage.service';
import { v4 as uuid } from 'uuid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class MenuService {
  private readonly cachePrefix = process.env.CACHE_PREFIX + ':menu';
  private static readonly DB_NAME = 'menus';
  private static readonly DB_COLUMNS = [
    'id',
    'name',
    'type',
    'value',
    'tag',
    'position_order',
    'image',
    'is_publish',
    'created_at',
    'updated_at',
  ];

  constructor(
    @InjectRepository(Menu)
    private readonly repository: Repository<Menu>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
    private readonly gcs: GoogleCloudStorage,
  ) {}

  async create(payload: CreateMenuDto, image: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let imageName = '';

    try {
      // check for image
      if (!image) throw new BadRequestException('Image is required');

      // validate position_order availability
      const [existingMenu] = await queryRunner.query(
        `
        SELECT position_order
        FROM ${MenuService.DB_NAME} 
        WHERE position_order = $1
        LIMIT 1
        `,
        [payload.position_order],
      );

      if (existingMenu) {
        throw new BadRequestException('Position order already filled');
      }

      imageName = uuid() + '.' + image.mimetype.split('/')[1];

      const imageUrl = await this.gcs.uploadFile({
        bucketName: process.env.STORAGE_BUCKET_NAME,
        destination: process.env.NODE_ENV,
        fileName: imageName,
        multerFile: image,
      });

      const menu = queryRunner.manager.create(Menu, {
        name: payload.name,
        type: payload.type,
        value: payload.value,
        tag: payload.tag,
        position_order: payload.position_order,
        is_publish: payload.is_publish,
        image: imageUrl,
      });

      await queryRunner.manager.save(menu);
      await queryRunner.commitTransaction();
      this.cacheManager
        .del(`${this.cachePrefix}:all`)
        .catch((error) => console.log('failed delete cache', error));

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Create menu success',
        data: {
          id: menu.id,
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
            console.log(`ERROR: ${MenuService.name}.${this.create.name}\n`);
          });
      }

      this.error.handleError(error, MenuService.name);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListMenuDto) {
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

      if (query.is_publish !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`is_publish = $${paramIndex}`);
        searchParams.push(query.is_publish);
      }

      if (query.tag !== undefined) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`tag = $${paramIndex}`);
        searchParams.push(query.tag);
      }

      if (query.name) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`LOWER(name) LIKE $${paramIndex}`);
        searchParams.push(`%${query.name.toLowerCase()}%`);
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

      if (query.position_order) {
        const paramIndex = searchParams.length + 1;
        searchConditions.push(`position_order = $${paramIndex}`);
        searchParams.push(query.position_order);
      }

      const searchCondition =
        searchConditions.length > 0
          ? `AND ${searchConditions.join(' AND ')}`
          : '';

      // Sorting logic
      let sortClause = 'ORDER BY position_order ASC';
      if (query.sort_by) {
        const validSortColumns = [
          'name',
          'type',
          'position_order',
          'is_publish',
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

      // Fetch menu query and parameters
      const fetchMenuQuery = `
        SELECT ${MenuService.DB_COLUMNS.join(', ')}
        FROM ${MenuService.DB_NAME}
        WHERE deleted_at IS NULL ${searchCondition}
        ${sortClause}
        LIMIT $${searchParams.length + 1}
        OFFSET $${searchParams.length + 2}
      `;
      const fetchMenuParams = [...searchParams, limit, offset];

      // Count total menu query and parameters
      const countMenuQuery = `
        SELECT COUNT(*) as count
        FROM ${MenuService.DB_NAME}
        WHERE deleted_at IS NULL
        ${searchCondition}
      `;
      const countMenuParams = searchParams;

      // Execute queries
      const [menus, [totalMenus]]: [Menu[], { count: number }[]] =
        await Promise.all([
          this.repository.query(fetchMenuQuery, fetchMenuParams),
          this.repository.query(countMenuQuery, countMenuParams),
        ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get menu success',
        data: menus.map((menu) => ({
          id: menu.id,
          name: menu.name,
          type: menu.type,
          value: menu.value,
          tag: menu.tag,
          position_order: menu.position_order,
          image: menu.image,
          is_publish: menu.is_publish,
          created_at: menu.created_at,
          updated_at: menu.updated_at,
        })),
        page: page,
        pageSize: limit,
        totalData: Number(totalMenus.count),
      });
    } catch (error) {
      this.error.handleError(error, `${MenuService.name}.${this.findAll.name}`);
    }
  }

  async findOne(id: string) {
    try {
      // database queries
      const [menu]: Menu[] = await this.repository.query(
        `
        SELECT ${MenuService.DB_COLUMNS.join(', ')}
        FROM ${MenuService.DB_NAME}
        WHERE deleted_at IS NULL
        AND id = $1
        LIMIT 1
        `,
        [id],
      );

      if (!menu) {
        throw new NotFoundException('Menu not found');
      }

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: menu.id,
          name: menu.name,
          type: menu.type,
          value: menu.value,
          tag: menu.tag,
          position_order: menu.position_order,
          image: menu.image,
          is_publish: menu.is_publish,
          created_at: menu.created_at,
          updated_at: menu.updated_at,
        },
      });
    } catch (error) {
      this.error.handleError(error, `${MenuService.name}.${this.findOne.name}`);
    }
  }

  async update(id: string, payload: UpdateMenuDto, image: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let imageName = '';

    try {
      const stmtQuery = `select * from menus where id = '${id}'`;
      const [menuData] = await queryRunner.manager.query(stmtQuery);

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

      const newMenu = queryRunner.manager.create(Menu, {
        name: payload.name ?? menuData.name,
        type: payload.type ?? menuData.type,
        value: payload.value ?? menuData.value,
        tag: payload.tag ?? menuData.tag,
        position_order:
          payload.position_order === undefined ? null : payload.position_order,
        is_publish: payload.is_publish ?? menuData.is_publish,
        image: imageUrl ?? menuData.image,
      });

      const { updateQuery, params } = this.queryHelper.update<Partial<Menu>>(
        id,
        newMenu,
        ['position_order'],
      );

      await queryRunner.query(
        `
        UPDATE ${MenuService.DB_NAME}
        SET ${updateQuery}
        WHERE id = $${params.length}
        RETURNING *
        `,
        params,
      );

      // delete prev images if exists
      if (image) {
        this.gcs
          .checkFileExists({
            bucketName: process.env.STORAGE_BUCKET_NAME,
            destination: process.env.NODE_ENV,
            fileName: this.gcs.extractFileName(menuData.image),
          })
          .then(() => {
            this.gcs
              .removeFile({
                bucketName: process.env.STORAGE_BUCKET_NAME,
                destination: process.env.NODE_ENV,
                fileName: this.gcs.extractFileName(menuData.image),
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
        message: 'Update menu success',
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
            console.log(`ERROR: ${MenuService.name}.${this.update.name}\n`);
          });
      }
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${MenuService.name}.${this.update.name}`);
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
      const [result] = await queryRunner.query(
        `
        UPDATE ${MenuService.DB_NAME}
        SET deleted_at = $1
        WHERE id = $2
        AND deleted_at IS NULL
        RETURNING *
        `,
        params,
      );

      if (!result) {
        throw new NotFoundException('Menu not found');
      }

      await queryRunner.commitTransaction();
      this.cacheManager
        .del(`${this.cachePrefix}:all`)
        .catch((error) => console.log('failed delete cache', error));

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete menu success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.error.handleError(error, `${MenuService.name}.${this.remove.name}`);
    } finally {
      await queryRunner.release();
    }
  }
}

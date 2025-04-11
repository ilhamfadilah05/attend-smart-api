import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from 'src/libs/entities/category.entity';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ListCategoryDto } from './dto/list-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}

  async create(payload: CreateCategoryDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const category = new Category();
      category.name = payload.name;
      category.type = payload.type;

      await queryRunner.manager.save(category);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: category.id,
          name: category.name,
          created_at: category.created_at,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${CategoryService.name}.${this.create.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListCategoryDto) {
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
          {
            param: 'type',
            column: 'type',
            operator: '=',
          },
        ],
        {
          queryString: query,
          params: [limit, offset],
          delete: { isNull: true, value: 'deleted_at' },
          created_at: { between: true, value: 'created_at' },
        },
      );

      let orderBy = 'ORDER BY created_at DESC';

      if (query.sort_by) {
        const column = this.queryHelper.sort(query.sort_by, [
          'created_at',
          'name',
          'slug',
          'description',
        ]);

        if (column !== undefined) {
          orderBy = `ORDER BY ${column}`;
        }
      }

      const [categories, [totalCategories]]: [Category[], { count: number }[]] =
        await Promise.all([
          this.repository.query(
            `SELECT id, name, type, created_at, updated_at FROM categories ${filter.where.q} ${orderBy} LIMIT $1 OFFSET $2`,
            filter.param.q,
          ),
          this.repository.query(
            `SELECT COUNT(*) as count FROM categories ${filter.where.c}`,
            filter.param.c,
          ),
        ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get categories success',
        data: categories,
        page: page,
        pageSize: limit,
        totalData: Number(totalCategories.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${CategoryService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const [category] = (await this.repository.query(
        'SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as Category[];

      if (!category) throw new NotFoundException('Category not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: category.id,
          name: category.name,
          type: category.type,
          created_at: category.created_at,
          updated_at: category.updated_at,
        },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${CategoryService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(id: string, payload: UpdateCategoryDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const [category] = (await this.repository.query(
        'SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as Category[];

      if (!category) throw new NotFoundException('Category not found');

      const { updateQuery, params } = this.queryHelper.update<
        Partial<Category>
      >(id, {
        name: payload.name,
        type: payload.type,
      });

      const querySQL = `UPDATE categories SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      const [[updatedResult]] = (await queryRunner.manager.query(
        querySQL,
        params,
      )) as [Category[]];

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: updatedResult.id,
          name: updatedResult.name,
          type: updatedResult.type,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${CategoryService.name}.${this.findOne.name}`,
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
      const querySQL = `UPDATE categories SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING *`;
      const params = [new Date(), id];

      const [[category]]: [Category[]] = await queryRunner.manager.query(
        querySQL,
        params,
      );

      if (!category) throw new NotFoundException('Campaign group not found');

      await queryRunner.commitTransaction();
      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Delete category success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${CategoryService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

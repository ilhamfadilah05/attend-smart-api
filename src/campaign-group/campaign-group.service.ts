import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCampaignGroupDto } from './dto/create-campaign-group.dto';
import { UpdateCampaignGroupDto } from './dto/update-campaign-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CampaginGroup } from 'src/libs/entities/campaign-group.entity';
import { DataSource, Repository } from 'typeorm';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { ListCampaignGroupDto } from './dto/list-campaign-group.dto';

@Injectable()
export class CampaignGroupService {
  constructor(
    @InjectRepository(CampaginGroup)
    private readonly repository: Repository<CampaginGroup>,
    private readonly queryHelper: QueryHelper,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}
  async create(payload: CreateCampaignGroupDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const [slugExist] = await queryRunner.manager.query(
        'SELECT slug FROM campaign_groups WHERE slug = $1 LIMIT 1',
        [payload.slug],
      );

      if (slugExist) throw new BadRequestException('Slug already exist');

      const group = new CampaginGroup();
      group.name = payload.name;
      group.slug = payload.slug;
      group.description = payload.description;

      await queryRunner.manager.save(group);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: group.id,
          name: group.name,
          created_at: group.created_at,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${CampaginGroup.name}.${this.create.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ListCampaignGroupDto) {
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
            param: 'slug',
            column: 'slug',
            operator: 'ILIKE',
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

      const [campaginGroups, [totalCampaginGroups]]: [
        CampaginGroup[],
        { count: number }[],
      ] = await Promise.all([
        this.repository.query(
          `SELECT id, name, slug, created_at, updated_at FROM campaign_groups ${filter.where.q} ${orderBy} LIMIT $1 OFFSET $2`,
          filter.param.q,
        ),
        this.repository.query(
          `SELECT COUNT(*) as count FROM campaign_groups ${filter.where.c}`,
          filter.param.c,
        ),
      ]);

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get campaign group success',
        data: campaginGroups.map((cg) => ({
          id: cg.id,
          name: cg.name,
          slug: cg.slug,
          created_at: cg.created_at,
          updated_at: cg.updated_at,
        })),
        page: page,
        pageSize: limit,
        totalData: Number(totalCampaginGroups.count),
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${CampaignGroupService.name}.${this.findAll.name}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const [campaignGroup] = (await this.repository.query(
        'SELECT * FROM campaign_groups WHERE id = $1 AND deleted_at IS NULL',
        [id],
      )) as CampaginGroup[];

      if (!campaignGroup)
        throw new NotFoundException('Campaign group not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: campaignGroup.id,
          name: campaignGroup.name,
          slug: campaignGroup.slug,
          created_at: campaignGroup.created_at,
          updated_at: campaignGroup.updated_at,
        },
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${CampaignGroupService.name}.${this.findOne.name}`,
      );
    }
  }

  async update(id: string, payload: UpdateCampaignGroupDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const [campaignGroup] = (await queryRunner.manager.query(
        'SELECT id FROM campaign_groups WHERE id = $1',
        [id],
      )) as CampaginGroup[];
      if (!campaignGroup)
        throw new NotFoundException('Campaign group not found');

      const { updateQuery, params } = this.queryHelper.update<
        Partial<CampaginGroup>
      >(id, {
        name: payload.name,
        description: payload.description,
        slug: payload.slug,
      });

      const querySQL = `UPDATE campaign_groups SET ${updateQuery} WHERE id = $${params.length} RETURNING *`;

      const [[updatedResult]] = (await queryRunner.manager.query(
        querySQL,
        params,
      )) as [CampaginGroup[]];
      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: updatedResult.id,
          name: updatedResult.name,
          description: updatedResult.description,
          slug: updatedResult.slug,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${CampaginGroup.name}.${this.findOne.name}`,
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
      const querySQL = `UPDATE campaign_groups SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING *`;
      const params = [new Date(), id];

      const [[campaignGroup]]: [CampaginGroup[]] =
        await queryRunner.manager.query(querySQL, params);

      if (!campaignGroup)
        throw new NotFoundException('Campaign group not found');
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
        `${CampaignGroupService.name}.${this.remove.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

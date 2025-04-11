import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Campaign } from 'src/libs/entities/campaign.entity';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { QueryHelper } from 'src/libs/helper/query.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { GoogleCloudStorage } from 'src/libs/service/gcs/google-cloud-storage.service';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { UpdateSedekahDto } from './dto/sedekah-dto';

@Injectable()
export class SedekahService {
  constructor(
    @InjectRepository(Campaign)
    private readonly repository: Repository<Campaign>,
    private readonly gcs: GoogleCloudStorage,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
    private readonly queryHelper: QueryHelper,
  ) {}

  async findSedekah() {
    try {
      const [campaign] = (await this.repository.query(
        `SELECT c.id, c.name, c.type, c.slug, c.description, c.city_id, c.campaign_group_id, c.is_publish, c.category, c.campaign_target, c.target_date, c.is_highlighted,
          c.current_funds, c.image, c.price, c.stock, c.max_weight, c.min_weight, c.sandra_program_uuid, c.sandra_project_uuid, c.max_profile_names,
          u.name as created_by, c.created_at, c.updated_at
          FROM campaigns c 
          JOIN users u ON c.created_by_id = u.id 
          WHERE c.slug = $1 AND c.deleted_at IS NULL`,
        ['sedekah'],
      )) as Campaign[];

      if (!campaign) throw new NotFoundException('Sedekah not found');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: campaign,
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${Campaign.name}.${this.findSedekah.name}`,
      );
    }
  }

  async update(payload: UpdateSedekahDto, image: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let imageName = '';
    try {
      let imageUrl: string = '';

      const [currentZakat] = (await queryRunner.manager.query(
        'SELECT id, slug, image FROM campaigns WHERE slug = $1',
        ['sedekah'],
      )) as Campaign[];

      if (!currentZakat) throw new NotFoundException('Sedekah not found');

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

      const { updateQuery, params } = this.queryHelper.update<any>(
        'sedekah',
        zakat,
      );

      const querySQL = `UPDATE campaigns SET ${updateQuery} WHERE slug = $${params.length} RETURNING *`;

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
            console.log(`ERROR: ${SedekahService.name}.${this.update.name}\n`);
          });
      }
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${Campaign.name}.${this.update.name}`);
    } finally {
      await queryRunner.release();
    }
  }
}

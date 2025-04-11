import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  ValidateIf,
} from 'class-validator';
import { FUND_TYPE } from 'src/libs/constant';

export enum CAMPAIGN_TYPE {
  KEMANUSIAAN = 'kemanusiaan',
  WAKAF = 'wakaf',
  KURBAN = 'kurban',
}

export class CreateCampaignDto {
  @ApiProperty({ description: 'Name of campaign' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of campaign' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Campaign image',
  })
  image: Express.Multer.File;

  @ApiProperty({ description: 'Slug' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    enum: CAMPAIGN_TYPE,
    enumName: 'CAMPAIGN_TYPE',
    description: `Shoukd be one of : ${Object.values(CAMPAIGN_TYPE).join(', ')}`,
  })
  @IsEnum(CAMPAIGN_TYPE, {
    message: `action should be one of: ${Object.values(CAMPAIGN_TYPE).join(', ')}`,
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: 'Campaign group id' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  @IsOptional()
  campaign_group_id: string;

  @ApiProperty({
    description: `Shoukd be one of : kemanusiaan, pendidikan, kesehatan, ekonomi, sosial-dakwah & lingkungan`,
  })
  @IsString()
  @IsOptional()
  category: string;

  @ApiPropertyOptional({ description: 'City id of campaign' })
  @IsNumber()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsOptional()
  city_id: number;

  @ApiPropertyOptional({
    description: 'Campaign target',
  })
  @IsNumber()
  @Transform(({ value }) =>
    value === '' || value === 'null' ? undefined : Number(value),
  )
  @IsOptional()
  campaign_target: number;

  @ApiPropertyOptional({ description: 'Target date' })
  @Transform(({ value }) =>
    value === '' || value === 'null' ? undefined : value,
  )
  @IsISO8601()
  @IsOptional()
  target_date: string;

  @ApiPropertyOptional({ description: 'Highlight campaign' })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  is_highlighted: boolean;

  @ApiPropertyOptional({ description: 'Publish campaign' })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  is_publish: boolean;

  @ApiPropertyOptional({ description: 'Sandra program id' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  @IsOptional()
  sandra_program_uuid: string;

  @ApiPropertyOptional({ description: 'Sandra project id' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  @IsOptional()
  sandra_project_uuid: string;

  @ApiPropertyOptional({ description: 'Thk livestock campaign id' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  @IsOptional()
  thk_livestock_campaign_uuid: string;

  @ApiPropertyOptional({
    description: 'Qurban price - Required if type is kurban',
  })
  @ValidateIf((o) => o.type === FUND_TYPE.KURBAN)
  @IsNumber({}, { message: 'Price must be a number' })
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNotEmpty({ message: 'Price is required when type is kurban' })
  price?: number;

  @ApiPropertyOptional({
    description: 'Qurban discount price',
  })
  @ValidateIf((o) => o.type === FUND_TYPE.KURBAN)
  @IsNumber({}, { message: 'Discount price must be a number' })
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsOptional()
  discount_price?: number;

  @ApiPropertyOptional({
    description: 'Max weight for a Qurban animal - Required if type is kurban',
  })
  @ValidateIf((o) => o.type === FUND_TYPE.KURBAN)
  @IsNumber({}, { message: 'Max weight must be a number' })
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNotEmpty({ message: 'Max weight is required when type is kurban' })
  max_weight?: number;

  @ApiPropertyOptional({
    description: 'Min wieght for a Qurban animal - Required if type is kurban',
  })
  @ValidateIf((o) => o.type === FUND_TYPE.KURBAN)
  @IsNumber({}, { message: 'Min weight must be a number' })
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNotEmpty({ message: 'Min weight is required when type is kurban' })
  min_weight?: number;

  @ApiPropertyOptional({
    description: 'Qurban stock - Required if type is kurban',
  })
  @ValidateIf((o) => o.type === FUND_TYPE.KURBAN)
  @IsNumber({}, { message: 'Stock must be a number' })
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNotEmpty({ message: 'Stock is required when type is kurban' })
  stock?: number;

  @ApiPropertyOptional({
    description: 'Max Profile Names - Required if type is kurban',
  })
  @ValidateIf((o) => o.type === FUND_TYPE.KURBAN)
  @IsNumber({}, { message: 'max_profile_names must be a number' })
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNotEmpty({ message: 'max_profile_names is required when type is kurban' })
  @Max(7)
  max_profile_names?: number;
}

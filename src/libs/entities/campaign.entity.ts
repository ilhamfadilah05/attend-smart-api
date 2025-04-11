import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CampaginGroup } from './campaign-group.entity';
import { City } from './city.entity';
import { FUND_TYPE } from '../constant';
import { User } from './user.entity';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: FUND_TYPE,
  })
  type: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  image: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  category: string;

  @Column('decimal', { precision: 16, scale: 2, default: 0 })
  current_funds: number;

  @Column('decimal', { precision: 16, scale: 2, nullable: true })
  campaign_target: number;

  @Column({ type: 'timestamp', nullable: true })
  target_date: Date;

  @Column({ type: 'boolean', default: false })
  is_highlighted: boolean;

  @Column({ type: 'boolean', default: false })
  is_publish: boolean;

  @ManyToOne(() => CampaginGroup, (v) => v.id, { nullable: true })
  @JoinColumn({ name: 'campaign_group_id' })
  campaignGroup: CampaginGroup;

  @ManyToOne(() => User, (v) => v.id)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @ManyToOne(() => City, (v) => v.id, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city_id: City;

  @Column({ type: 'uuid', nullable: true })
  thk_livestock_campaign_uuid: string;

  @Column({ type: 'uuid', nullable: true })
  sandra_project_uuid: string;

  @Column({ type: 'uuid', nullable: true })
  sandra_program_uuid: string;

  @Column('decimal', { precision: 16, scale: 2, nullable: true })
  price: number;

  @Column('decimal', { precision: 16, scale: 2, nullable: true })
  discount_price: number;

  @Column({ type: 'int', nullable: true })
  stock: number;

  @Column({ type: 'smallint', nullable: true })
  max_weight: number;

  @Column({ type: 'smallint', nullable: true })
  min_weight: number;

  @Column({ type: 'smallint', nullable: true })
  max_profile_names: number;

  @CreateDateColumn({ type: 'timestamp', update: false })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ nullable: true, type: 'timestamp' })
  deleted_at: Date;
}

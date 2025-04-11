import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BANNER_TYPE } from '../constant';

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: BANNER_TYPE,
  })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @Column({ type: 'boolean', default: false })
  is_publish: boolean;

  @Column({ type: 'int', nullable: true })
  position_order: number;

  @Column({ type: 'varchar', length: 255 })
  image: string;

  @CreateDateColumn({ type: 'timestamp', update: false })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ nullable: true, type: 'timestamp' })
  deleted_at: Date;
}

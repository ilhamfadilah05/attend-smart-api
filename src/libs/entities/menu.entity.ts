import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MENU_TYPE } from '../constant';

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  image: string;

  @Column({
    type: 'enum',
    enum: MENU_TYPE,
  })
  type: MENU_TYPE;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  tag: string;

  @Column({ type: 'smallint', nullable: true })
  position_order: number;

  @Column({ type: 'boolean', default: false })
  is_publish: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true, type: 'timestamp' })
  deleted_at: Date;
}

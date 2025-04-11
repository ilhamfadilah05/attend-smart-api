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
import { Province } from './province.entity';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Province, (v) => v.id)
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'jsonb' })
  meta: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true, type: 'timestamp' })
  deleted_at: Date;
}

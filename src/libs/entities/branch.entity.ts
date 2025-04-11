import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @Column({ type: 'int' })
  radius: number;

  @Column({ type: 'int' })
  tolerance: number;

  @Column({ type: 'varchar', length: 255 })
  lat_long: string;

  @Column({ type: 'varchar', length: 255 })
  work_start_time: string;

  @Column({ type: 'varchar', length: 255 })
  work_end_time: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}

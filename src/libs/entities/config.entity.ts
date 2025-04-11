import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('global_configs')
export class Config {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, length: 255 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @CreateDateColumn({ type: 'timestamp', update: false })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ nullable: true, type: 'timestamp' })
  deleted_at: Date;
}

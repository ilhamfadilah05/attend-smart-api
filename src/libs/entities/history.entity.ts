import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from './department.entity';
import { Branch } from './branch.entity';
import { Employee } from './employee.entity';
import { Submission } from './submission.entity';

@Entity('histories')
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, (v) => v.id, {
    nullable: true,
    cascade: ['remove'],
  })
  @JoinColumn({ name: 'id_employee' })
  id_employee: Employee;

  @ManyToOne(() => Department, (v) => v.id, {
    nullable: true,
    cascade: ['remove'],
  })
  @JoinColumn({ name: 'id_department' })
  department: Department;

  @ManyToOne(() => Branch, (v) => v.id, { nullable: true, cascade: ['remove'] })
  @JoinColumn({ name: 'id_branch' })
  branch: Branch;

  @ManyToOne(() => Submission, (v) => v.id, {
    nullable: true,
    cascade: ['remove'],
  })
  @JoinColumn({ name: 'id_submission' })
  id_submission: Submission;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lat_long: string;

  @Column({ type: 'int', nullable: true })
  delayed: number;

  @CreateDateColumn({ type: 'timestamp' })
  date_attend: Date;

  @Column({ type: 'varchar', length: 255 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 255 })
  image: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}

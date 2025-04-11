import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';
import { Branch } from './branch.entity';
import { Salary } from './salary.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (v) => v.id, { nullable: true })
  @JoinColumn({ name: 'id_user' })
  user: User;

  @ManyToOne(() => Department, (v) => v.id, { nullable: true })
  @JoinColumn({ name: 'id_department' })
  department: Department;

  @ManyToOne(() => Branch, (v) => v.id, { nullable: true })
  @JoinColumn({ name: 'id_branch' })
  branch: Branch;

  @ManyToOne(() => Salary, (v) => v.id, { nullable: true })
  @JoinColumn({ name: 'id_salary' })
  salary: Salary;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  gender: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 255 })
  image: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  token_notif: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}

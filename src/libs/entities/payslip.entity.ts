import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Salary } from './salary.entity';

@Entity('payslips')
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, (v) => v.id, { nullable: true })
  @JoinColumn({ name: 'id_employee' })
  id_employee: Employee;

  @ManyToOne(() => Salary, (v) => v.id, { nullable: true })
  @JoinColumn({ name: 'id_salary' })
  id_salary: Salary;

  @Column({ type: 'int' })
  absence_days: number;

  @Column({ type: 'int' })
  attendance_days: number;

  @Column({ type: 'int' })
  overtime_days: number;

  @CreateDateColumn({ type: 'timestamp' })
  payroll_month: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}

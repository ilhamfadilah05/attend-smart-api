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
import { Employee } from './employee.entity';

@Entity('salaries')
export class Salary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, (v) => v.id, { nullable: true })
  @JoinColumn({ name: 'id_employee' })
  id_employee: Employee;

  @Column('decimal', { precision: 16, scale: 2 })
  base_salary: number;

  @Column('decimal', { precision: 16, scale: 2 })
  meal_allowance: number;

  @Column('decimal', { precision: 16, scale: 2 })
  health_allowance: number;

  @Column('decimal', { precision: 16, scale: 2 })
  bonus_amount: number;

  @Column('decimal', { precision: 16, scale: 2 })
  absence_deduction_amount: number;

  @Column('decimal', { precision: 16, scale: 2 })
  overtime_amount: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @DeleteDateColumn({ nullable: true, type: 'timestamp' })
  deleted_at: Date;
}

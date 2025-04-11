import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TRANSACTION_TYPE } from '../constant';
import { orderNumberGenerator } from '../helper/common.helper';
import { Donor } from './donor.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  hid: string;

  @Column({ type: 'varchar', length: 255 })
  donor_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ type: 'boolean', default: false })
  is_anonim: boolean;

  @Column({
    type: 'enum',
    enum: TRANSACTION_TYPE,
  })
  @Index()
  status: string;

  @ManyToOne(() => Donor, (d) => d.id, { nullable: true })
  @JoinColumn({ name: 'donor_id' })
  donor: Donor;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sandra_program_hid: string;

  @CreateDateColumn({ type: 'timestamp', update: false })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ nullable: true, type: 'timestamp' })
  deleted_at: Date;

  @BeforeInsert()
  generateId() {
    this.hid = orderNumberGenerator();
  }
}

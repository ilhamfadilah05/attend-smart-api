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

import { Transaction } from './transaction.entity';
import { Campaign } from './campaign.entity';

@Entity('transaction_items')
export class TransactionItem {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Transaction, (v) => v.id)
  @JoinColumn({ name: 'transaction_id' })
  transaction_id: Transaction;

  @Column('decimal', { precision: 16, scale: 2 })
  amount: number;

  @ManyToOne(() => Campaign, (v) => v.id)
  @JoinColumn({ name: 'campaign_id' })
  campaign_id: Campaign;

  @Column({ type: 'json' })
  campaign_snapshot: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_2: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_3: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_4: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_5: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_6: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_7: string;

  @CreateDateColumn({ type: 'timestamp', update: false })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ nullable: true, type: 'timestamp' })
  deleted_at: Date;
}

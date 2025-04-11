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
import { Broadcast } from './broadcast.entity';

@Entity('broadcast_sends')
export class BroadcastSend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, (v) => v.id, { nullable: true })
  @JoinColumn({ name: 'id_employee' })
  id_employee: Employee;

  @ManyToOne(() => Broadcast, (v) => v.id, { nullable: true })
  @JoinColumn({ name: 'id_broadcast' })
  id_broadcast: Broadcast;

  @Column({ type: 'boolean' })
  is_read: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}

import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity('user_activities')
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  user_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_email: string;

  @Column({ type: 'uuid' })
  role_id: string;

  @Column({ type: 'varchar', length: 255 })
  role_name: string;

  @Column({ type: 'uuid', nullable: true })
  table_id: string;

  @Column({ type: 'varchar', length: 255 })
  table_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  action_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject_name: string;

  @Column({ type: 'json', nullable: true })
  data_before: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  data_after: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ip: string;

  @CreateDateColumn({ nullable: true, type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => User, (el) => el.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (el) => el.id)
  @JoinColumn({ name: 'role_id' })
  role: Role;
}

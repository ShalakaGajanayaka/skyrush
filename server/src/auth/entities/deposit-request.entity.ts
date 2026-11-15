import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum DepositStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('deposit_requests')
@Index(['status', 'createdAt'])
export class DepositRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Index()
  @Column()
  username: string;

  @Column({ nullable: true })
  email?: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'USD', length: 10 })
  currency: string;

  @Column()
  paymentMethod: string; // 'binance_usdt', 'bank_transfer'

  @Index({ unique: true })
  @Column({ unique: true })
  referenceNumber: string;

  @Index()
  @Column({ default: DepositStatus.PENDING })
  status: string;

  @Column({ nullable: true })
  adminNote?: string;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ nullable: true, type: 'timestamp' })
  approvedAt?: Date;

  @Column({ default: false })
  isFirstDeposit: boolean;

  @Column({ default: false })
  referralCommissionPaid: boolean;

  @Column('decimal', { precision: 12, scale: 4, default: 0.0 })
  referralCommissionAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

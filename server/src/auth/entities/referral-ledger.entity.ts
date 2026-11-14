import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('referral_ledger')
@Index(['referrerId', 'createdAt'])
export class ReferralLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  referrerId: string;

  @Index()
  @Column()
  referredUserId: string;

  @Column('decimal', { precision: 18, scale: 6 })
  betAmount: number;

  @Column('decimal', { precision: 6, scale: 4 })
  commissionRate: number;

  @Column('decimal', { precision: 18, scale: 6 })
  earnedAmount: number;

  @Column({ default: 'WAGER_COMMISSION', length: 30 })
  type: string; // 'WAGER_COMMISSION', 'FTD_BONUS'

  @CreateDateColumn()
  createdAt: Date;
}

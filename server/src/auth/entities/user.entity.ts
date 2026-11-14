import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Check, Index } from 'typeorm';

@Entity('users')
@Check(`"balance" >= 0`)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column('decimal', { precision: 18, scale: 6, default: 0.0 })
  balance: number;

  @Column({ default: 0 })
  gamesPlayed: number;

  @Column('decimal', { precision: 18, scale: 6, default: 0.0 })
  totalWon: number;

  @Column('decimal', { precision: 8, scale: 2, default: 1.0 })
  bestMultiplier: number;

  @Column({ default: 'USD', length: 10 })
  currency: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ type: 'jsonb', nullable: true })
  savedWithdrawalDetails: any;

  @Column({ default: false })
  isFrozen: boolean;

  @Column({ nullable: true })
  freezeReason: string;

  @Column({ default: false })
  isFlaggedForReview: boolean;

  @Column({ nullable: true })
  flaggedReason: string;

  @Column({ default: false })
  isMarketing: boolean;

  @Column({ default: false })
  isMarketingAutoWin: boolean;

  @Index({ unique: true })
  @Column({ nullable: true, length: 16 })
  referralCode: string;

  @Index()
  @Column({ nullable: true })
  referredById: string;

  @Column('decimal', { precision: 18, scale: 6, default: 0.0 })
  referralBalance: number;

  @Column('decimal', { precision: 18, scale: 6, default: 0.0 })
  totalReferralEarnings: number;

  @Column({ default: 'BRONZE', length: 20 })
  referralTier: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

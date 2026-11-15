export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type WithdrawalStatus = 'PENDING' | 'PAID' | 'REJECTED' | 'CANCELLED';

export interface DepositRequest {
  id: string;
  userId: string;
  username: string;
  email?: string;
  amount: number | string;
  currency: string;
  paymentMethod: string;
  referenceNumber: string;
  status: DepositStatus;
  adminNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  isFirstDeposit?: boolean;
  referralCommissionPaid?: boolean;
  referralCommissionAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  email?: string;
  amount: number | string;
  currency: string;
  method: string;
  payoutDetails: string;
  status: WithdrawalStatus;
  isMarketing?: boolean;
  adminNote?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  currency: string;
  balance: number | string;
  gamesPlayed: number;
  totalWon: number | string;
  isFrozen?: boolean;
  isMarketing?: boolean;
  isMarketingAutoWin?: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  pendingDeposits: number;
  approvedDeposits: number;
  totalDepositedAmount: number;
  pendingWithdrawals: number;
  paidWithdrawals: number;
  totalWithdrawnAmount: number;
  totalSystemBalance: number;
  globalPool?: number;
  pendingGlobalPool?: number | null;
  companyNetProfit?: number;
}

export interface PaymentChannel {
  id: string;
  name: string;
  type: string;
  badge: string;
  accountNumber: string;
  accountName: string;
  instructions: string;
  iconName: string;
}

export interface PoolAuditLog {
  id: string;
  adminUser: string;
  action: 'TOP_UP' | 'PROFIT_SKIM' | 'SET_TARGET';
  previousAmount: number | string;
  newAmount: number | string;
  delta: number | string;
  note?: string;
  createdAt: string;
}

export interface MaintenanceStatus {
  isScheduled: boolean;
  isActive: boolean;
  targetTime: number | null;
  remainingSeconds: number;
  message: string;
}

export interface BetHistoryRecord {
  id: string;
  userId: string;
  betAmount: number | string;
  cashOutMultiplier: number | string | null;
  crashPoint: number | string;
  winAmount: number | string;
  currency: string;
  createdAt: string;
}

export interface PlayerFinancialSummary {
  currentBalance: number;
  totalDepositedAmount: number;
  totalApprovedDepositsCount: number;
  totalWithdrawnAmount: number;
  totalPaidWithdrawalsCount: number;
  netCashFlow: number;
  totalWageredAmount: number;
  totalWonAmount: number;
  netGGR: number;
  totalBetsCount: number;
}

export interface PlayerDetailedHistoryResponse {
  success: boolean;
  user: User;
  summary: PlayerFinancialSummary;
  counts: {
    bets: number;
    deposits: number;
    withdrawals: number;
  };
  page: number;
  limit: number;
  bets: BetHistoryRecord[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
}

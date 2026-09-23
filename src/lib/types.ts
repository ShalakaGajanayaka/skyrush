export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type WithdrawalStatus = 'PENDING' | 'PAID' | 'REJECTED';

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

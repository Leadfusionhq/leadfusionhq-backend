// types/wallet.ts

// Card interface for payment methods
export interface Card {
    id: string;
    token: string;
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault: boolean;
    createdAt: string;
    
  }
  
  // Wallet balance interface
  export interface WalletBalance {
    id: string;
    userId: string;
    balance: number;
    currency: string;
    updatedAt: string;
  }
  
  // Auto top-up rules interface
  export interface AutoTopUpRule {
    id: string;
    userId: string;
    isEnabled: boolean;
    threshold: number;
    rechargeAmount: number;
    defaultCardId: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // Transaction interface for wallet activities
  export interface Transaction {
    id: string;
    userId: string;
    type: 'manual_recharge' | 'auto_topup' | 'deduction';
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    cardId?: string;
    description: string;
    createdAt: string;
  }
  
  // API Response interfaces
  export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
  }
  
  // Specific response types
  export interface BalanceResponse {
    balance: WalletBalance;
  }
  
  export interface CardsResponse {
    cards: Card[];
  }
  
  export interface AutoTopUpResponse {
    autoTopUp: AutoTopUpRule;
  }
  
  export interface TransactionsResponse {
    transactions: Transaction[];
  }
  
  // Form data interfaces
  export interface AddCardFormData {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  }
  
  export interface RechargeFormData {
    amount: string;
    cardId: string;
  }
  
  export interface AutoTopUpFormData {
    threshold: number;
    rechargeAmount: number;
    isEnabled: boolean;
    defaultCardId: string;
  }
  
  // API request payload interfaces
  export interface CreateCardRequest {
    userId: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  }
  
  export interface RechargeRequest {
    userId: string;
    amount: number;
    cardId: string;
  }
  
  export interface SetDefaultCardRequest {
    userId: string;
  }
  
  export interface UpdateAutoTopUpRequest {
    userId: string;
    threshold: number;
    rechargeAmount: number;
    isEnabled: boolean;
    defaultCardId: string;
  }
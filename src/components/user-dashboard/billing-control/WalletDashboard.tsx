// components/WalletDashboard.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Plus, Settings, History, DollarSign, Zap, Bell, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axiosWrapper from "@/utils/api";
import { BILLING_API } from "@/utils/apiUrl";
import { API_URL } from "@/utils/apiUrl";

// Enhanced TypeScript interfaces
interface Card {
  customerVaultId: string;
  cardLastFour: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  cardholderName?: string;
}

interface AutoTopUpRule {
  threshold: number;
  rechargeAmount: number;
  isEnabled: boolean;
  defaultCardId: string;
}

interface PaymentMethodDetails {
  lastFour: string;
  brand: string;
}

interface Transaction {
  _id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT' | 'DEDUCTION' | 'WITHDRAWAL';
  status: 'COMPLETED' | 'SUCCESS' | 'FAILED' | 'PENDING';
  description: string;
  createdAt: string;
  balanceAfter?: number;
  note?: string;
  paymentMethodDetails?: PaymentMethodDetails;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface CardsResponse {
  cards: Card[];
}

interface TermsResponse {
  hasAccepted: boolean;
}

interface BalanceResponse {
  balance: {
    balance: number;
  };
}

interface AutoTopUpResponse {
  autoTopUp: AutoTopUpRule | null;
}

interface CardFormErrors {
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardholderName?: string;
  billing_address?: string;
  zip?: string;
}

interface CardFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  billing_address: string;
  zip: string;
}

interface AutoTopUpFormData {
  threshold: number;
  rechargeAmount: number;
  isEnabled: boolean;
  defaultCardId: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

type TabType = 'overview' | 'cards' | 'settings' | 'history';

const WalletDashboard: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const userId = currentUser?._id;

  // State management
  const [balance, setBalance] = useState<number>(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [autoTopUp, setAutoTopUp] = useState<AutoTopUpRule | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Terms state
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
  const [termsContent, setTermsContent] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Manual recharge state
  const [showAddFunds, setShowAddFunds] = useState<boolean>(false);
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [rechargeLoading, setRechargeLoading] = useState<boolean>(false);

  // Add card state
  const [showAddCard, setShowAddCard] = useState<boolean>(false);
  const [cardForm, setCardForm] = useState<CardFormData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    billing_address: '',
    zip: ''
  });
  const [cardFormErrors, setCardFormErrors] = useState<CardFormErrors>({});
  const [addCardLoading, setAddCardLoading] = useState<boolean>(false);

  // Auto top-up settings
  const [autoTopUpForm, setAutoTopUpForm] = useState<AutoTopUpFormData>({
    threshold: 50,
    rechargeAmount: 250,
    isEnabled: false,
    defaultCardId: ''
  });
  const [autoTopUpLoading, setAutoTopUpLoading] = useState<boolean>(false);

  // Toast notification system
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, type, message };
    setToasts(prev => [...prev, newToast]);
   
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Form management
  const resetCardForm = useCallback(() => {
    setCardForm({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: '',
      billing_address: '',
      zip: ''
    });
    setCardFormErrors({});
  }, []);

  const resetAddFundsForm = useCallback(() => {
    setRechargeAmount('');
    setSelectedCardId('');
  }, []);

  const closeAddFundsModal = useCallback(() => {
    setShowAddFunds(false);
    resetAddFundsForm();
  }, [resetAddFundsForm]);

  const closeAddCardModal = useCallback(() => {
    setShowAddCard(false);
    resetCardForm();
  }, [resetCardForm]);

  const closeTermsModal = useCallback(() => {
    setShowTermsModal(false);
    setPendingAction(null);
  }, []);

  // Enhanced card validation functions
  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;
    
    // Luhn algorithm validation
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i));
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const validateExpiryDate = (month: string, year: string): { monthValid: boolean; yearValid: boolean; dateValid: boolean } => {
    const monthValid = /^(0[1-9]|1[0-2])$/.test(month);
    const yearValid = /^\d{4}$/.test(year);
    
    if (!monthValid || !yearValid) {
      return { monthValid, yearValid, dateValid: false };
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const expiryYear = parseInt(year);
    const expiryMonth = parseInt(month);
    
    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return { monthValid, yearValid, dateValid: false };
    }
    
    return { monthValid, yearValid, dateValid: true };
  };

  const validateCardForm = useCallback((): boolean => {
    const errors: CardFormErrors = {};
   
    // Card number validation with Luhn algorithm
    const cardNumber = cardForm.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (!validateCardNumber(cardNumber)) {
      errors.cardNumber = 'Invalid card number';
    }

    // Expiry date validation
    const expiryValidation = validateExpiryDate(cardForm.expiryMonth, cardForm.expiryYear);
    
    if (!cardForm.expiryMonth) {
      errors.expiryMonth = 'Month is required';
    } else if (!expiryValidation.monthValid) {
      errors.expiryMonth = 'Invalid month (01-12)';
    }

    if (!cardForm.expiryYear) {
      errors.expiryYear = 'Year is required';
    } else if (!expiryValidation.yearValid) {
      errors.expiryYear = 'Invalid year (YYYY)';
    } else if (!expiryValidation.dateValid && expiryValidation.monthValid && expiryValidation.yearValid) {
      errors.expiryYear = 'Card has expired';
    }

    // CVV validation
    if (!cardForm.cvv) {
      errors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cardForm.cvv)) {
      errors.cvv = 'CVV must be 3 or 4 digits';
    }

    // Cardholder name validation
    if (!cardForm.cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    } else if (cardForm.cardholderName.trim().length < 2) {
      errors.cardholderName = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(cardForm.cardholderName)) {
      errors.cardholderName = 'Name can only contain letters and spaces';
    }

    // Billing address validation
    if (!cardForm.billing_address.trim()) {
      errors.billing_address = 'Billing address is required';
    } else if (cardForm.billing_address.trim().length < 5) {
      errors.billing_address = 'Address must be at least 5 characters';
    }

    // Enhanced ZIP validation (supports different formats)
    if (!cardForm.zip.trim()) {
      errors.zip = 'ZIP code is required';
    } else if (!/^(\d{5}(-\d{4})?|\d{6}|[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d)$/.test(cardForm.zip.trim())) {
      errors.zip = 'Invalid ZIP code format';
    }

    setCardFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [cardForm]);

  // API functions
  const checkTermsAcceptance = useCallback(async (): Promise<void> => {
    if (!userId || !token) return;
   
    try {
      const url = API_URL.ACCEPT_CONTRACT.replace(':userId', userId);
      const response = await axiosWrapper(
        "get",
        url,
        {},
        token
      ) as TermsResponse;
     
      setHasAcceptedTerms(response.hasAccepted || false);
    } catch (error) {
      console.error('Failed to check terms status:', error);
      setHasAcceptedTerms(false);
    }
  }, [userId, token]);

  const handleAcceptTerms = useCallback(async (): Promise<void> => {
    if (!userId || !token) return;
   
    try {
      const url = API_URL.ACCEPT_CONTRACT.replace(':userId', userId);
      const response = await axiosWrapper(
        "put",
        url,
        {},
        token
      ) as ApiResponse;
     
      if (response.success) {
        setHasAcceptedTerms(true);
        showToast('success', 'Terms accepted successfully');
        closeTermsModal(); // Close modal first
        
        // Execute pending action after closing modal
        if (pendingAction) {
          setTimeout(() => {
            pendingAction();
            setPendingAction(null);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Failed to accept terms:', error);
      showToast('error', 'Failed to accept terms. Please try again.');
    }
  }, [userId, token, pendingAction, showToast, closeTermsModal]);

  const loadTermsContent = useCallback(async (): Promise<void> => {
    try {
      // Add comprehensive dummy terms and conditions
      const dummyTermsContent = `
        <div class="space-y-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          
          <section>
            <h2 class="text-lg font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h2>
            <p class="text-gray-700 mb-4">
              By accessing and using this wallet service, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-gray-800 mb-2">2. Payment Processing</h2>
            <p class="text-gray-700 mb-4">
              All payment transactions are processed securely through our certified payment gateway. We use industry-standard encryption 
              to protect your financial information. By adding a payment method, you authorize us to charge the selected payment method 
              for wallet top-ups and other services.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-gray-800 mb-2">3. Auto Top-Up Service</h2>
            <p class="text-gray-700 mb-4">
              When you enable auto top-up, you authorize us to automatically charge your selected payment method when your wallet 
              balance falls below the specified threshold. You can modify or disable this feature at any time through your wallet settings.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-gray-800 mb-2">4. Refund Policy</h2>
            <p class="text-gray-700 mb-4">
              Wallet funds are generally non-refundable. However, in cases of unauthorized transactions or system errors, 
              we will investigate and provide appropriate remediation. Please contact our support team within 30 days of any disputed transaction.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-gray-800 mb-2">5. Security and Privacy</h2>
            <p class="text-gray-700 mb-4">
              We implement robust security measures to protect your account and financial information. You are responsible for 
              maintaining the confidentiality of your account credentials. Please notify us immediately of any unauthorized access or suspicious activity.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-gray-800 mb-2">6. Service Availability</h2>
            <p class="text-gray-700 mb-4">
              While we strive to maintain 99.9% uptime, we do not guarantee uninterrupted service. We may perform maintenance 
              or updates that could temporarily affect service availability. We will provide advance notice when possible.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-gray-800 mb-2">7. Limitation of Liability</h2>
            <p class="text-gray-700 mb-4">
              Our liability is limited to the amount in your wallet balance. We are not liable for any indirect, incidental, 
              special, or consequential damages arising from your use of this service.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-gray-800 mb-2">8. Modifications to Terms</h2>
            <p class="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. 
              Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-gray-800 mb-2">9. Contact Information</h2>
            <p class="text-gray-700 mb-4">
              If you have any questions about these Terms and Conditions, please contact our support team at support@example.com 
              or through the help section in your account dashboard.
            </p>
          </section>

          <p class="text-sm text-gray-600 mt-6 p-4 bg-gray-50 rounded-lg">
            <strong>Last updated:</strong> September 12, 2025<br>
            <strong>Effective date:</strong> September 12, 2025
          </p>
        </div>
      `;
      setTermsContent(dummyTermsContent);
    } catch (error) {
      console.error('Failed to load terms:', error);
      setTermsContent('<p class="text-red-600">Failed to load terms and conditions. Please try again.</p>');
    }
  }, []);

  const fetchTransactions = useCallback(async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<TransactionsResponse> => {
    if (!token) throw new Error('No authentication token');
   
    try {
      const response = await axiosWrapper(
        "get",
        BILLING_API.TRANSACTIONS,
        { params },
        token
      ) as TransactionsResponse;
      return response;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  }, [token]);

  const fetchUserTransactions = useCallback(async (page = 1, limit = 50): Promise<void> => {
    try {
      const response = await fetchTransactions({ page, limit });
      setTransactions(response.transactions);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      showToast('error', 'Failed to load transactions');
    }
  }, [fetchTransactions, showToast]);

  const calculateBalanceFromTransactions = useCallback((transactions: Transaction[]): number => {
    if (transactions.length === 0) return 0;

    const sortedTransactions = [...transactions].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sortedTransactions[0].balanceAfter || 0;
  }, []);

  const fetchWalletData = useCallback(async (): Promise<void> => {
    if (!token) return;
   
    try {
      setLoading(true);

      const [cardsResponse, transactionsResponse] = await Promise.all([
        axiosWrapper("get", BILLING_API.GET_CARDS, {}, token) as Promise<CardsResponse>,
        fetchTransactions({ page: 1, limit: 50 })
      ]);

      const calculatedBalance = calculateBalanceFromTransactions(transactionsResponse.transactions);

      // Fetch auto top-up settings (placeholder for actual API)
      const autoTopUpResponse: AutoTopUpResponse = { autoTopUp: null };

      setBalance(calculatedBalance);
      setCards(cardsResponse.cards || []);
      setAutoTopUp(autoTopUpResponse.autoTopUp);
      setTransactions(transactionsResponse.transactions || []);
      setPagination(transactionsResponse.pagination);

      if (autoTopUpResponse.autoTopUp) {
        setAutoTopUpForm({
          threshold: autoTopUpResponse.autoTopUp.threshold,
          rechargeAmount: autoTopUpResponse.autoTopUp.rechargeAmount,
          isEnabled: autoTopUpResponse.autoTopUp.isEnabled,
          defaultCardId: autoTopUpResponse.autoTopUp.defaultCardId
        });
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      showToast('error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [token, fetchTransactions, calculateBalanceFromTransactions, showToast]);

  const handleManualRecharge = useCallback(async (): Promise<void> => {
    const amount = parseFloat(rechargeAmount);
    
    if (!rechargeAmount || amount <= 0) {
      showToast('error', 'Please enter a valid amount');
      return;
    }

    if (amount < 1) {
      showToast('error', 'Minimum recharge amount is $1.00');
      return;
    }

    if (amount > 10000) {
      showToast('error', 'Maximum recharge amount is $10,000.00');
      return;
    }

    if (!selectedCardId) {
      showToast('error', 'Please select a payment method');
      return;
    }

    if (!hasAcceptedTerms) {
      showToast('error', 'Please accept the Terms & Conditions before adding funds');
      await loadTermsContent();
      setPendingAction(() => () => executeManualRecharge());
      setShowTermsModal(true);
      return;
    }
   
    await executeManualRecharge();
  }, [rechargeAmount, selectedCardId, hasAcceptedTerms, loadTermsContent, showToast]);

  const executeManualRecharge = useCallback(async (): Promise<void> => {
    if (!token) return;
   
    try {
      setRechargeLoading(true);
      const response = await axiosWrapper("post", BILLING_API.ADD_FUNDS, {
        amount: parseFloat(rechargeAmount),
        vaultId: selectedCardId
      }, token) as ApiResponse;

      if (response.success) {
        showToast('success', 'Funds added successfully!');
        
        // Create a new transaction for immediate UI update
        const newTransaction: Transaction = {
          _id: Date.now().toString(),
          amount: parseFloat(rechargeAmount),
          type: 'CREDIT',
          status: 'SUCCESS',
          description: `Wallet top-up - $${parseFloat(rechargeAmount).toFixed(2)}`,
          createdAt: new Date().toISOString(),
          balanceAfter: balance + parseFloat(rechargeAmount),
          paymentMethodDetails: {
            lastFour: cards.find(c => c.customerVaultId === selectedCardId)?.cardLastFour || '',
            brand: cards.find(c => c.customerVaultId === selectedCardId)?.brand || ''
          }
        };

        // Update balance and transactions immediately
        setBalance(prev => prev + parseFloat(rechargeAmount));
        setTransactions(prev => [newTransaction, ...prev]);
        
        closeAddFundsModal();
        
        // Refresh data in background for accuracy
        setTimeout(() => {
          fetchWalletData();
        }, 1000);
      } else {
        showToast('error', response.message || 'Failed to add funds');
      }
    } catch (error: unknown) {
      console.error('Recharge error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add funds';
      showToast('error', errorMessage);
    } finally {
      setRechargeLoading(false);
    }
  }, [token, rechargeAmount, selectedCardId, balance, cards, fetchWalletData, showToast, closeAddFundsModal]);

  const handleAddCard = useCallback(async (): Promise<void> => {
    if (!validateCardForm()) {
      showToast('error', 'Please fix the form errors');
      return;
    }

    if (!hasAcceptedTerms) {
      showToast('error', 'Please accept the Terms & Conditions before adding a card');
      await loadTermsContent();
      setPendingAction(() => () => executeAddCard());
      setShowTermsModal(true);
      return;
    }
   
    await executeAddCard();
  }, [validateCardForm, hasAcceptedTerms, loadTermsContent, showToast]);

  const executeAddCard = useCallback(async (): Promise<void> => {
    if (!token) return;
   
    try {
      setAddCardLoading(true);
      const response = await axiosWrapper("post", BILLING_API.SAVE_CARD, {
        card_number: cardForm.cardNumber.replace(/\s/g, ''),
        expiry_month: cardForm.expiryMonth,
        expiry_year: cardForm.expiryYear,
        cvv: cardForm.cvv,
        full_name: cardForm.cardholderName,
        billing_address: cardForm.billing_address,
        zip: cardForm.zip
      }, token) as ApiResponse;

      if (response.success) {
        showToast('success', 'Card added successfully!');
        closeAddCardModal();
        await fetchWalletData(); // Refresh data after successful operation
      } else {
        showToast('error', response.message || 'Failed to add card');
      }
    } catch (error: unknown) {
      console.error('Add card error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add card';
      showToast('error', errorMessage);
    } finally {
      setAddCardLoading(false);
    }
  }, [token, cardForm, fetchWalletData, showToast, closeAddCardModal]);

  const handleSetDefaultCard = useCallback(async (vaultId: string): Promise<void> => {
    if (!token) return;
   
    try {
      const response = await axiosWrapper("post", BILLING_API.SET_DEFAULT_CARD, {
        vaultId
      }, token) as ApiResponse;

      if (response.success) {
        showToast('success', 'Default card updated!');
        await fetchWalletData(); // Refresh data after successful operation
      } else {
        showToast('error', response.message || 'Failed to update default card');
      }
    } catch (error: unknown) {
      console.error('Update default card error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update default card';
      showToast('error', errorMessage);
    }
  }, [token, fetchWalletData, showToast]);

  const handleUpdateAutoTopUp = useCallback(async (): Promise<void> => {
    if (!token) return;
   
    try {
      setAutoTopUpLoading(true);
      const response = await axiosWrapper("post", '/api/wallet/auto-topup', {
        enabled: autoTopUpForm.isEnabled,
        threshold: autoTopUpForm.threshold,
        rechargeAmount: autoTopUpForm.rechargeAmount,
        defaultCardId: autoTopUpForm.defaultCardId
      }, token) as ApiResponse;

      if (response.success) {
        showToast('success', 'Auto top-up settings updated!');
        await fetchWalletData(); // Refresh data after successful operation
      } else {
        showToast('error', response.message || 'Failed to update auto top-up settings');
      }
    } catch (error: unknown) {
      console.error('Update auto top-up error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update auto top-up settings';
      showToast('error', errorMessage);
    } finally {
      setAutoTopUpLoading(false);
    }
  }, [token, autoTopUpForm, fetchWalletData, showToast]);

  // Enhanced form field handlers with real-time validation
  const handleCardFormChange = useCallback((field: keyof CardFormData, value: string) => {
    let processedValue = value;
    
    // Format card number with spaces
    if (field === 'cardNumber') {
      processedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      if (processedValue.length > 19) processedValue = processedValue.slice(0, 19);
    }
    
    // Format expiry month
    if (field === 'expiryMonth') {
      processedValue = value.replace(/\D/g, '');
      if (processedValue.length === 1 && parseInt(processedValue) > 1) {
        processedValue = '0' + processedValue;
      }
      if (processedValue.length > 2) processedValue = processedValue.slice(0, 2);
    }
    
    // Format expiry year
    if (field === 'expiryYear') {
      processedValue = value.replace(/\D/g, '');
      if (processedValue.length > 4) processedValue = processedValue.slice(0, 4);
    }
    
    // Format CVV
    if (field === 'cvv') {
      processedValue = value.replace(/\D/g, '');
      if (processedValue.length > 4) processedValue = processedValue.slice(0, 4);
    }
    
    // Format cardholder name
    if (field === 'cardholderName') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    
    setCardForm(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear error when user starts typing
    if (cardFormErrors[field]) {
      setCardFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [cardFormErrors]);

  // Effects
  useEffect(() => {
    if (userId && token) {
      checkTermsAcceptance();
      fetchWalletData();
    }
  }, [userId, token, checkTermsAcceptance, fetchWalletData]);

  // Load terms content when modal is opened
  useEffect(() => {
    if (showTermsModal && !termsContent) {
      loadTermsContent();
    }
  }, [showTermsModal, termsContent, loadTermsContent]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
            <div className="bg-white rounded-xl p-6 mb-8">
              <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
              <div className="h-12 bg-gray-300 rounded w-48"></div>
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-300 rounded w-64 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-white text-gray-800 border border-gray-200' :
              'bg-white text-gray-800 border border-gray-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-gray-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-600" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-500 hover:text-gray-700 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-black">Wallet</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAddFunds(true)}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Funds</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <div className="bg-black rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Current Balance</p>
              <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-gray-400" />
          </div>
          {autoTopUp?.isEnabled && (
            <div className="mt-4 flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm">Auto Top-Up: ${autoTopUp.rechargeAmount} when below ${autoTopUp.threshold}</span>
            </div>
          )}
        </div>

        {/* Add Funds Section */}
        {showAddFunds && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black">Add Funds</h3>
              <button onClick={closeAddFundsModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="pl-8 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="0.00"
                    min="1"
                    max="10000"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum: $1.00, Maximum: $10,000.00</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Card <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Choose a payment method</option>
                  {cards.map((card) => (
                    <option key={card.customerVaultId} value={card.customerVaultId}>
                      **** **** **** {card.cardLastFour} ({card.brand}) {card.isDefault ? '- Default' : ''}
                    </option>
                  ))}
                </select>
              </div>
       
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fundsTerms"
                  checked={hasAcceptedTerms}
                  onChange={(e) => {
                    if (!hasAcceptedTerms) {
                      setShowTermsModal(true);
                      e.preventDefault();
                    } else {
                      setHasAcceptedTerms(false);
                    }
                  }}
                  className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                />
                <label htmlFor="fundsTerms" className="text-sm font-medium text-gray-700">
                  I accept the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-black hover:text-gray-700 underline"
                  >
                    Terms & Conditions
                  </button>
                  {hasAcceptedTerms && " ✓"}
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeAddFundsModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualRecharge}
                disabled={rechargeLoading}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {rechargeLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>Add Funds</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview', icon: DollarSign },
                { key: 'cards', label: 'Payment Methods', icon: CreditCard },
                { key: 'settings', label: 'Auto Top-Up', icon: Settings },
                { key: 'history', label: 'Transaction History', icon: History }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as TabType)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === key
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black">Wallet Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700">Available Balance</h3>
                  <p className="text-2xl font-bold text-black">${balance.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700">Saved Cards</h3>
                  <p className="text-2xl font-bold text-black">{cards.length}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700">Auto Top-Up</h3>
                  <p className="text-lg font-semibold text-black">
                    {autoTopUp?.isEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-black">Payment Methods</h2>
                <button
                  onClick={() => setShowAddCard(true)}
                  className="bg-black text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Card</span>
                </button>
              </div>

              {/* Add Card Form */}
              {showAddCard && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-black">Add Payment Method</h3>
                    <button onClick={closeAddCardModal} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cardForm.cardNumber}
                        onChange={(e) => handleCardFormChange('cardNumber', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                          cardFormErrors.cardNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                        }`}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                      {cardFormErrors.cardNumber && (
                        <p className="mt-1 text-sm text-red-600">{cardFormErrors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Month <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cardForm.expiryMonth}
                          onChange={(e) => handleCardFormChange('expiryMonth', e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                            cardFormErrors.expiryMonth ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                          }`}
                          placeholder="MM"
                          maxLength={2}
                        />
                        {cardFormErrors.expiryMonth && (
                          <p className="mt-1 text-sm text-red-600">{cardFormErrors.expiryMonth}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cardForm.expiryYear}
                          onChange={(e) => handleCardFormChange('expiryYear', e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                            cardFormErrors.expiryYear ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                          }`}
                          placeholder="YYYY"
                          maxLength={4}
                        />
                        {cardFormErrors.expiryYear && (
                          <p className="mt-1 text-sm text-red-600">{cardFormErrors.expiryYear}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cardForm.cvv}
                          onChange={(e) => handleCardFormChange('cvv', e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                            cardFormErrors.cvv ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                          }`}
                          placeholder="123"
                          maxLength={4}
                        />
                        {cardFormErrors.cvv && (
                          <p className="mt-1 text-sm text-red-600">{cardFormErrors.cvv}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cardholder Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cardForm.cardholderName}
                        onChange={(e) => handleCardFormChange('cardholderName', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                          cardFormErrors.cardholderName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                        }`}
                        placeholder="John Doe"
                      />
                      {cardFormErrors.cardholderName && (
                        <p className="mt-1 text-sm text-red-600">{cardFormErrors.cardholderName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Billing Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cardForm.billing_address}
                        onChange={(e) => handleCardFormChange('billing_address', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                          cardFormErrors.billing_address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                        }`}
                        placeholder="123 Main Street, City, State"
                      />
                      {cardFormErrors.billing_address && (
                        <p className="mt-1 text-sm text-red-600">{cardFormErrors.billing_address}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cardForm.zip}
                        onChange={(e) => handleCardFormChange('zip', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                          cardFormErrors.zip ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                        }`}
                        placeholder="12345"
                      />
                      {cardFormErrors.zip && (
                        <p className="mt-1 text-sm text-red-600">{cardFormErrors.zip}</p>
                      )}
                    </div>
                   
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="cardTerms"
                        checked={hasAcceptedTerms}
                        onChange={(e) => {
                          if (!hasAcceptedTerms) {
                            setShowTermsModal(true);
                            e.preventDefault();
                          } else {
                            setHasAcceptedTerms(false);
                          }
                        }}
                        className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                      />
                      <label htmlFor="cardTerms" className="text-sm font-medium text-gray-700">
                        I accept the{" "}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-black hover:text-gray-700 underline"
                        >
                          Terms & Conditions
                        </button>
                        {hasAcceptedTerms && " ✓"}
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={closeAddCardModal}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCard}
                      disabled={addCardLoading}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {addCardLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      <span>Add Card</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <div key={card.customerVaultId} className="border border-gray-200 rounded-lg p-4 relative hover:shadow-md transition-shadow bg-white">
                    {card.isDefault && (
                      <span className="absolute top-2 right-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded border border-gray-200">
                        Default
                      </span>
                    )}
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-black">**** **** **** {card.cardLastFour}</p>
                        <p className="text-sm text-gray-500">{card.brand} • {card.expiryMonth}/{card.expiryYear}</p>
                        {card.cardholderName && (
                          <p className="text-xs text-gray-400">{card.cardholderName}</p>
                        )}
                      </div>
                    </div>
                    {!card.isDefault && (
                      <button
                        onClick={() => handleSetDefaultCard(card.customerVaultId)}
                        className="mt-2 text-sm text-black hover:text-gray-700 transition-colors underline"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {cards.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No payment methods added yet</p>
                  <p className="text-sm">Add a card to start managing your wallet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black">Auto Top-Up Settings</h2>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoTopUpForm.isEnabled}
                    onChange={(e) => setAutoTopUpForm({ ...autoTopUpForm, isEnabled: e.target.checked })}
                    className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable Auto Top-Up</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recharge When Balance Falls Below
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={autoTopUpForm.threshold}
                        onChange={(e) => setAutoTopUpForm({ ...autoTopUpForm, threshold: parseFloat(e.target.value) || 0 })}
                        className="pl-8 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recharge Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={autoTopUpForm.rechargeAmount}
                        onChange={(e) => setAutoTopUpForm({ ...autoTopUpForm, rechargeAmount: parseFloat(e.target.value) || 0 })}
                        className="pl-8 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Card for Auto Top-Up
                  </label>
                  <select
                    value={autoTopUpForm.defaultCardId}
                    onChange={(e) => setAutoTopUpForm({ ...autoTopUpForm, defaultCardId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select a card</option>
                    {cards.map((card) => (
                      <option key={card.customerVaultId} value={card.customerVaultId}>
                        **** **** **** {card.cardLastFour} ({card.brand}) {card.isDefault ? '- Default' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleUpdateAutoTopUp}
                  disabled={autoTopUpLoading}
                  className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {autoTopUpLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Update Settings</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black">Transaction History</h2>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => fetchUserTransactions(pagination.page - 1, pagination.limit)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-black text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </span>
                  <button
                    onClick={() => fetchUserTransactions(pagination.page + 1, pagination.limit)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 bg-black text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No transactions found</p>
                    <p className="text-sm">Your transaction history will appear here</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.status === 'COMPLETED' || transaction.status === 'SUCCESS' ? 'bg-gray-600' :
                          transaction.status === 'FAILED' ? 'bg-gray-800' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="font-medium text-black">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {transaction.paymentMethodDetails && ` • Card: ****${transaction.paymentMethodDetails.lastFour}`}
                          </p>
                          {transaction.note && (
                            <p className="text-xs text-gray-400 mt-1">{transaction.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.type === 'DEDUCTION' || transaction.type === 'WITHDRAWAL' ? 'text-gray-800' : 'text-black'
                        }`}>
                          {transaction.type === 'DEDUCTION' || transaction.type === 'WITHDRAWAL' ? '-' : '+'}${transaction.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {transaction.status.toLowerCase()}
                        </p>
                        {transaction.balanceAfter !== undefined && (
                          <p className="text-xs text-gray-400">
                            Balance: ${transaction.balanceAfter.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col m-4 border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-black">Terms & Conditions</h3>
              <button
                onClick={closeTermsModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              {termsContent ? (
                <div dangerouslySetInnerHTML={{ __html: termsContent }} />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <p>Loading terms and conditions...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={hasAcceptedTerms}
                  onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                />
                <label htmlFor="acceptTerms" className="text-sm font-medium text-gray-700">
                  I have read and accept the Terms & Conditions
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeTermsModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptTerms}
                  disabled={!hasAcceptedTerms}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm Acceptance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDashboard;
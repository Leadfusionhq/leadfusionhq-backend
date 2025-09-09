"use client";

import React, { useState, useEffect } from "react";
import axiosWrapper from "@/utils/api";
import { BILLING_API } from "@/utils/apiUrl";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import PaymentForm from "@/components/billing/PaymentForm";
import Wallet from "@/components/billing/Wallet";
import PaymentMethods from "@/components/billing/PaymentMethods";
import BillingAlert from "@/components/billing/BillingAlert";
import ContractModal from "@/components/billing/ContractModal";

interface PaymentMethod {
  id: string;
  nameOnCard: string;
  lastFourDigits: string;
  expirationDate: string;
  isPrimary: boolean;
  brand: string;
}

interface BillingData {
  balance: number;
  walletAmount: number;
  paymentMethods: PaymentMethod[];
  hasAcceptedContract: boolean;
  lowBalanceThreshold: number;
  autoTopupEnabled: boolean;
  autoTopupAmount: number;
}

interface PaymentFormData {
  nameOnCard: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingEmail: string;
}

const BillingControl = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(true);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Billing data state
  const [billingData, setBillingData] = useState<BillingData>({
    balance: 75.50,
    walletAmount: 100.00,
    paymentMethods: [
      {
        id: "1",
        nameOnCard: "Breet Coper",
        lastFourDigits: "9845",
        expirationDate: "02/2030",
        isPrimary: true,
        brand: "visa"
      }
    ],
    hasAcceptedContract: false,
    lowBalanceThreshold: 100,
    autoTopupEnabled: true,
    autoTopupAmount: 100
  });

  // Contract text template
  const contractText = `
    <h3>LEAD GENERATION SERVICE AGREEMENT</h3>
    <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
    
    <h4>1. SERVICE DESCRIPTION</h4>
    <p>Company agrees to provide qualified lead generation services to Client based on the specified criteria and target parameters. All leads will be verified and meet the quality standards established in the service level agreement.</p>
    
    <h4>2. BILLING AND PAYMENT TERMS</h4>
    <p>Client agrees to maintain sufficient funds in their account for continuous service. Automatic charges will be processed when balance falls below the minimum threshold of $${billingData.lowBalanceThreshold}. Payment will be automatically charged to the primary payment method on file.</p>
    
    <h4>3. PAYMENT AUTHORIZATION</h4>
    <p>By signing this agreement, Client authorizes Company to charge the stored payment method for:</p>
    <ul>
      <li>Lead generation services as consumed at the agreed-upon rate</li>
      <li>Account balance top-ups when balance is insufficient (minimum $${billingData.autoTopupAmount})</li>
      <li>Any applicable service fees, processing fees, or taxes</li>
      <li>Recurring monthly service charges if applicable</li>
    </ul>
    
    <h4>4. AUTOMATIC TOP-UP POLICY</h4>
    <p>When your account balance falls below $${billingData.lowBalanceThreshold}, we will automatically charge your primary payment method $${billingData.autoTopupAmount} to ensure uninterrupted service. You may modify these settings in your billing dashboard.</p>
    
    <h4>5. DATA SECURITY AND COMPLIANCE</h4>
    <p>All payment information is securely processed and stored in compliance with PCI DSS Level 1 standards. We use industry-standard encryption and security measures to protect your financial information. Payment processing is handled by certified payment processors.</p>
    
    <h4>6. SERVICE CONTINUITY AND SUSPENSION</h4>
    <p>Services may be temporarily suspended if:</p>
    <ul>
      <li>Payment methods fail or are declined</li>
      <li>Account balance is insufficient and auto-top-up fails</li>
      <li>Account is past due beyond the grace period</li>
      <li>Fraudulent activity is suspected</li>
    </ul>
    
    <h4>7. REFUND AND CANCELLATION POLICY</h4>
    <p>Refunds for unused leads may be requested within 30 days of purchase. Processing fees are non-refundable. Account cancellation requires 30 days written notice.</p>
    
    <h4>8. MODIFICATION OF TERMS</h4>
    <p>Company reserves the right to modify these terms with 30 days written notice to Client via email. Continued use of services after notification constitutes acceptance of modified terms.</p>
    
    <h4>9. DISPUTE RESOLUTION</h4>
    <p>Any billing disputes must be reported within 60 days of the transaction date. Disputes will be investigated and resolved within 10 business days.</p>
    
    <h4>10. GOVERNING LAW</h4>
    <p>This agreement shall be governed by the laws of [Your State/Country] without regard to conflict of law provisions.</p>
    
    <h4>11. CONTACT INFORMATION</h4>
    <p>For billing inquiries, contact your account manager or our billing department at billing@company.com or 1-800-XXX-XXXX.</p>
    
    <p><strong>ELECTRONIC SIGNATURE ACKNOWLEDGMENT:</strong></p>
    <p>By providing your electronic signature below, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions. You confirm that you are authorized to enter into this agreement on behalf of yourself or your organization.</p>
    
    <p><em>This electronic signature has the same legal effect as a handwritten signature.</em></p>
  `;

  // Calculate amounts for wallet display
  const totalAmount = 12.47;
  const finalPay = Math.max(0, totalAmount - billingData.walletAmount);

  // Fetch billing data on component mount
  useEffect(() => {
    fetchBillingData();
  }, []);

  // Check if balance is low
  useEffect(() => {
    if (billingData.balance < billingData.lowBalanceThreshold) {
      setShowAlert(true);
    }
  }, [billingData.balance, billingData.lowBalanceThreshold]);

  // Fetch billing information from API
  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      

      const response = (await axiosWrapper("get", BILLING_API.BILLING, {}, token ?? undefined)) as {
        message?: string;
        data?: any;

      };
      if (response.data) {
        setBillingData({
          balance: response.data.wallet?.balance || 0,
          walletAmount: response.data.wallet?.balance || 0,
          paymentMethods: response.data.paymentMethods || [],
          hasAcceptedContract: response.data.hasAcceptedContract || false,
          lowBalanceThreshold: response.data.wallet?.lowBalanceThreshold || 100,
          autoTopupEnabled: response.data.wallet?.autoTopupEnabled || true,
          autoTopupAmount: response.data.wallet?.autoTopupAmount || 100
        });
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setError('Failed to load billing information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment form submission
  const handlePaymentSubmit = async (paymentData: PaymentFormData) => {
    try {
      setProcessingPayment(true);
      setError(null);
      
      // Check if user has accepted contract first
      if (!billingData.hasAcceptedContract) {
        setShowContractModal(true);
        // Store payment data for processing after contract acceptance
        sessionStorage.setItem('pendingPaymentData', JSON.stringify(paymentData));
        return;
      }

      // Process payment method addition
      await processPaymentMethod(paymentData);
      
    } catch (error) {
      console.error('Error in payment submission:', error);
      setError('Failed to process payment information. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Process payment method addition
  const processPaymentMethod = async (paymentData: PaymentFormData) => {
    try {
      const response = (await axiosWrapper("post", "/api/billing/payment-methods", {
        nameOnCard: paymentData.nameOnCard,
        cardNumber: paymentData.cardNumber,
        expiryDate: paymentData.expiryDate,
        cvv: paymentData.cvv,
        billingEmail: paymentData.billingEmail,
        billingAddress: {
          // Add billing address fields as needed
        }
      }, token ?? undefined)) as {
        message?: string;
        data?: any;
      };
      
      if (response.data?.paymentMethod) {
        // Update local state with new payment method
        setBillingData(prev => ({
          ...prev,
          paymentMethods: [...prev.paymentMethods, {
            id: response.data.paymentMethod.id,
            nameOnCard: response.data.paymentMethod.nameOnCard,
            lastFourDigits: response.data.paymentMethod.lastFourDigits,
            expirationDate: response.data.paymentMethod.expirationDate,
            isPrimary: response.data.paymentMethod.isPrimary,
            brand: response.data.paymentMethod.cardType
          }]
        }));
        
        setShowPaymentForm(false);
        // Clear any stored payment data
        sessionStorage.removeItem('pendingPaymentData');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to add payment method');
    }
  };

  // Handle contract acceptance
  const handleContractAccept = async (signature: string, date: string) => {
    try {
      setProcessingPayment(true);
      
      const response = (await axiosWrapper("post", BILLING_API.ACCEPT_CONTRACT, 
        {signature,
        acceptedAt: date,
        contractText}, token ?? undefined)) as {
        message?: string;
        data?: any;

      };
      // Update local state
      setBillingData(prev => ({ ...prev, hasAcceptedContract: true }));
      setShowContractModal(false);
      
      // Process any pending payment data
      const pendingPaymentData = sessionStorage.getItem('pendingPaymentData');
      if (pendingPaymentData) {
        const paymentData = JSON.parse(pendingPaymentData);
        await processPaymentMethod(paymentData);
      }
      
    } catch (error) {
      console.error('Error saving contract acceptance:', error);
      setError('Failed to save contract acceptance. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Set primary payment method
  const handleSetPrimaryPayment = async (methodId: string) => {
    try {
      const response = (await axiosWrapper("put", `/api/billing/payment-methods/${methodId}/set-primary`, {}, token ?? undefined)) as {
        message?: string;
        data?: any;
      };
      
      // Update local state
      setBillingData(prev => ({
        ...prev,
        paymentMethods: prev.paymentMethods.map(method => ({
          ...method,
          isPrimary: method.id === methodId
        }))
      }));
      
    } catch (error) {
      console.error('Error setting primary payment method:', error);
      setError('Failed to update primary payment method');
    }
  };

  // Delete payment method
  const handleDeletePaymentMethod = async (methodId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment method? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = (await axiosWrapper("delete", `/api/billing/payment-methods/${methodId}`, {}, token ?? undefined)) as {
        message?: string;
        data?: any;
      };
      
      // Update local state
      setBillingData(prev => ({
        ...prev,
        paymentMethods: prev.paymentMethods.filter(method => method.id !== methodId)
      }));
      
    } catch (error) {
      console.error('Error deleting payment method:', error);
      setError('Failed to delete payment method');
    }
  };

  // Handle add money to wallet
  const handleAddMoney = () => {
    // You can implement a modal for custom amounts or use default auto-topup amount
    handlePayNow(billingData.autoTopupAmount);
  };

  // Process immediate payment
  const handlePayNow = async (customAmount?: number) => {
    try {
      setProcessingPayment(true);
      setError(null);
      
      const amount = customAmount || finalPay;
      
      if (amount <= 0) {
        setError('Invalid payment amount');
        return;
      }
      
      // Check if user has accepted contract
      if (!billingData.hasAcceptedContract) {
        setShowContractModal(true);
        return;
      }
      
      // Check if user has a primary payment method
      const hasPrimaryMethod = billingData.paymentMethods.some(method => method.isPrimary);
      if (!hasPrimaryMethod) {
        setError('Please add a payment method before making a payment');
        setShowPaymentForm(true);
        return;
      }
      
      const response = (await axiosWrapper("post", "/api/billing/pay-now", {
        amount: amount,
        description: customAmount ? 'Wallet top-up' : 'Account balance payment'
      }, token ?? undefined)) as {
        message?: string;
        data?: any;
      };
      
      if (response.data?.newBalance !== undefined) {
        // Update wallet balance
        setBillingData(prev => ({
          ...prev,
          balance: response.data.newBalance,
          walletAmount: response.data.newBalance
        }));
        
        // Hide alert if balance is now sufficient
        if (response.data.newBalance >= billingData.lowBalanceThreshold) {
          setShowAlert(false);
        }
      }
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setError(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle contact manager
  const handleContactManager = () => {
    // Implement contact functionality - could be email, chat, or phone
    window.open('mailto:josh.rodgers@company.com?subject=Account Balance Alert', '_blank');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded mb-4"></div>
          <div className="h-48 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Billing Controller
        </h1>
        <p className="text-gray-600">
          Manage your billing information, view invoices, and update payment methods.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Low Balance Alert */}
      {showAlert && billingData.balance < billingData.lowBalanceThreshold && (
        <BillingAlert
          balance={billingData.lowBalanceThreshold}
          accountManager="Josh Rodgers"
          onClose={() => setShowAlert(false)}
          onContactManager={handleContactManager}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Payment Form or Add Payment Button */}
        <div>
          {showPaymentForm ? (
            <PaymentForm
              onSubmit={handlePaymentSubmit}
              loading={processingPayment}
            />
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Add Payment Method</h2>
              <p className="text-gray-600 mb-6">
                Add a new payment method to your account for automatic billing and wallet top-ups.
                Your payment information is securely encrypted and stored.
              </p>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">Secure Payment Processing</h3>
                  <p className="text-sm text-blue-700">
                    We use bank-level encryption and PCI DSS compliant systems to protect your payment information.
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-200 w-full"
                >
                  Add New Payment Method
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Wallet */}
        <div>
          <Wallet
            totalAmount={totalAmount}
            walletAmount={billingData.walletAmount}
            finalPay={finalPay}
            onAddMoney={handleAddMoney}
            onPayNow={() => handlePayNow()}
            loading={processingPayment}
          />
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="mt-8">
        <PaymentMethods
          paymentMethods={billingData.paymentMethods}
          onSetPrimary={handleSetPrimaryPayment}
          onDeleteMethod={handleDeletePaymentMethod}
          onAddNew={() => setShowPaymentForm(true)}
        />
      </div>

      {/* Auto Top-up Settings */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Auto Top-up Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Balance Threshold
            </label>
            <div className="text-lg font-semibold text-gray-900">
              ${billingData.lowBalanceThreshold.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">
              Auto top-up triggers when balance falls below this amount
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto Top-up Amount
            </label>
            <div className="text-lg font-semibold text-gray-900">
              ${billingData.autoTopupAmount.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">
              Amount charged during auto top-up
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto Top-up Status
            </label>
            <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              billingData.autoTopupEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {billingData.autoTopupEnabled ? 'Enabled' : 'Disabled'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Automatic charging when balance is low
            </p>
          </div>
        </div>
      </div>

      {/* Contract Modal */}
      <ContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        onAccept={handleContractAccept}
        contractText={contractText}
      />
    </div>
  );
};

export default BillingControl;
// components/WalletDashboard.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Card, WalletBalance, AutoTopUpRule, Transaction } from '@/types/wallet';
import { CreditCard, Plus, Settings, History, DollarSign, Zap, Bell, X } from 'lucide-react';
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axiosWrapper from "@/utils/api";
import { BILLING_API } from "@/utils/apiUrl";

interface WalletDashboardProps {

}

const WalletDashboard: React.FC<WalletDashboardProps> = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  
  const userId = currentUser?._id; 
  const userBalance = currentUser?.balance || 0;

  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [autoTopUp, setAutoTopUp] = useState<AutoTopUpRule | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'settings' | 'history'>('overview');
  const [loading, setLoading] = useState(true);

  // Manual recharge state
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');

  // Add card state
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    billing_address: '',
    zip: ''
  });

  // Auto top-up settings
  const [autoTopUpForm, setAutoTopUpForm] = useState({
    threshold: 50,
    rechargeAmount: 250,
    isEnabled: false,
    defaultCardId: ''
  });

  useEffect(() => {
    if (userId && token) {
      fetchWalletData();
    }
  }, [userId, token?? undefined]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      // Fetch cards using axiosWrapper
      const cardsResponse = await axiosWrapper("get", BILLING_API.GET_CARDS, {}, token ?? undefined) as { cards: Card[] };
      
      // For other endpoints, you'll need to implement them in your backend or use existing ones
      // These are placeholder calls - you'll need to adjust based on your actual API endpoints
      const [balanceRes, autoTopUpRes, transactionsRes] = await Promise.all([
        // These endpoints need to be implemented in your backend
        // For now, using mock data or you can implement these endpoints
        Promise.resolve({ balance: { balance: 0 } }),
        Promise.resolve({ autoTopUp: null }),
        Promise.resolve({ transactions: [] })
      ]);

      setBalance(balanceRes.balance);
      setCards(cardsResponse.cards || []);
      setAutoTopUp(autoTopUpRes.autoTopUp);
      setTransactions(transactionsRes.transactions || []);

      if (autoTopUpRes.autoTopUp) {
        setAutoTopUpForm({
          threshold: autoTopUpRes.autoTopUp.threshold,
          rechargeAmount: autoTopUpRes.autoTopUp.rechargeAmount,
          isEnabled: autoTopUpRes.autoTopUp.isEnabled,
          defaultCardId: autoTopUpRes.autoTopUp.defaultCardId
        });
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRecharge = async () => {
    if (!rechargeAmount || !selectedCardId) {
      alert('Please enter amount and select a card');
      return;
    }

    try {
      const response = await axiosWrapper("post", BILLING_API.ADD_FUNDS, {
        amount: parseFloat(rechargeAmount),
        vaultId: selectedCardId
      }, token ?? undefined) as { success: boolean; message?: string };
      

      if (response.success) {
        setShowAddFunds(false);
        setRechargeAmount('');
        fetchWalletData();
        alert('Recharge successful!');
      } else {
        alert(response.message || 'Recharge failed');
      }
    } catch (error: any) {
      console.error('Recharge error:', error);
      alert(error.message || 'Recharge failed');
    }
  };

  const handleAddCard = async () => {
    try {
      const [expiryMonth, expiryYear] = [cardForm.expiryMonth, cardForm.expiryYear];
      
      const response = await axiosWrapper("post", BILLING_API.SAVE_CARD, {
        card_number: cardForm.cardNumber.replace(/\s/g, ''),
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        cvv: cardForm.cvv,
        full_name: cardForm.cardholderName,
        billing_address: cardForm.billing_address || '123 Default St',
        zip: cardForm.zip || '00000'
      }, token ?? undefined) as { success: boolean; message?: string; data?: any };

      if (response.success) {
        setShowAddCard(false);
        setCardForm({
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          cardholderName: '',
          billing_address: '',
          zip: ''
        });
        fetchWalletData();
        alert('Card added successfully!');
      } else {
        alert(response.message || 'Failed to add card');
      }
    } catch (error: any) {
      console.error('Add card error:', error);
      alert(error.message || 'Failed to add card');
    }
  };

  const handleSetDefaultCard = async (vaultId: string) => {
    try {
      const response = await axiosWrapper("post", BILLING_API.SET_DEFAULT_CARD, {
        vaultId
      }, token ?? undefined) as { success: boolean; message?: string };

      if (response.success) {
        fetchWalletData();
        alert('Default card updated!');
      } else {
        alert(response.message || 'Failed to update default card');
      }
    } catch (error: any) {
      console.error('Update default card error:', error);
      alert(error.message || 'Failed to update default card');
    }
  };

  const handleUpdateAutoTopUp = async () => {
    try {
      // This endpoint needs to be implemented in your backend
      // For now, this is a placeholder
      const response = await axiosWrapper("post", '/api/wallet/auto-topup', {
        enabled: autoTopUpForm.isEnabled,
        threshold: autoTopUpForm.threshold,
        rechargeAmount: autoTopUpForm.rechargeAmount,
        defaultCardId: autoTopUpForm.defaultCardId
      }, token ?? undefined) as { success: boolean; message?: string };

      if (response.success) {
        fetchWalletData();
        alert('Auto top-up settings updated!');
      } else {
        alert(response.message || 'Failed to update auto top-up settings');
      }
    } catch (error: any) {
      console.error('Update auto top-up error:', error);
      alert(error.message || 'Failed to update auto top-up settings');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAddFunds(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Current Balance</p>
              <p className="text-3xl font-bold">${userBalance.toFixed(2) || '0.00'}</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
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
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Funds</h3>
              <button onClick={() => setShowAddFunds(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="pl-8 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Card
                </label>
                <select
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a card</option>
                  {cards.map((card) => (
                    <option key={card.customerVaultId } value={card.customerVaultId}>
                      **** **** **** {card.cardLastFour} ({card.brand})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddFunds(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleManualRecharge}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Funds
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
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
                  onClick={() => setActiveTab(key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Wallet Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800">Available Balance</h3>
                  <p className="text-2xl font-bold text-green-600">${balance?.balance?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800">Saved Cards</h3>
                  <p className="text-2xl font-bold text-blue-600">{cards.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-800">Auto Top-Up</h3>
                  <p className="text-lg font-semibold text-purple-600">
                    {autoTopUp?.isEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
                <button
                  onClick={() => setShowAddCard(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Card</span>
                </button>
              </div>
              
              {/* Add Card Form */}
              {showAddCard && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Add Payment Method</h3>
                    <button onClick={() => setShowAddCard(false)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardForm.cardNumber}
                        onChange={(e) => setCardForm({...cardForm, cardNumber: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Month
                        </label>
                        <input
                          type="text"
                          value={cardForm.expiryMonth}
                          onChange={(e) => setCardForm({...cardForm, expiryMonth: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="MM"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Year
                        </label>
                        <input
                          type="text"
                          value={cardForm.expiryYear}
                          onChange={(e) => setCardForm({...cardForm, expiryYear: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="YYYY"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardForm.cvv}
                        onChange={(e) => setCardForm({...cardForm, cvv: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardForm.cardholderName}
                        onChange={(e) => setCardForm({...cardForm, cardholderName: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Billing Address
                      </label>
                      <input
                        type="text"
                        value={cardForm.billing_address}
                        onChange={(e) => setCardForm({...cardForm, billing_address: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="123 Main St"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={cardForm.zip}
                        onChange={(e) => setCardForm({...cardForm, zip: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="12345"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowAddCard(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCard}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Card
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <div key={card.customerVaultId} className="border rounded-lg p-4 relative">
                    {card.isDefault && (
                      <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium">**** **** **** {card.cardLastFour}</p>
                        <p className="text-sm text-gray-500">{card.brand} • {card.expiryMonth}/{card.expiryYear}</p>
                      </div>
                    </div>
                    {!card.isDefault && (
                      <button
                        onClick={() => handleSetDefaultCard(card.customerVaultId)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Auto Top-Up Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoTopUpForm.isEnabled}
                    onChange={(e) => setAutoTopUpForm({...autoTopUpForm, isEnabled: e.target.checked})}
                    className="w-4 h-4 text-blue-600"
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
                        onChange={(e) => setAutoTopUpForm({...autoTopUpForm, threshold: parseFloat(e.target.value)})}
                        className="pl-8 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        onChange={(e) => setAutoTopUpForm({...autoTopUpForm, rechargeAmount: parseFloat(e.target.value)})}
                        className="pl-8 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    onChange={(e) => setAutoTopUpForm({...autoTopUpForm, defaultCardId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a card</option>
                    {cards.map((card) => (
                      <option key={card.customerVaultId} value={card.customerVaultId}>
                        **** **** **** {card.cardLastFour} ({card.brand})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleUpdateAutoTopUp}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Update Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
              
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-500' :
                        transaction.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'deduction' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'deduction' ? '-' : '+'}${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">{transaction.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;
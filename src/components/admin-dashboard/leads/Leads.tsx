"use client";

import { useState } from "react";
import AllLeadsTable from "./AllLeadsTable";
import ReturnLeadsTable from "./ReturnLeadsTable";
import { Users, Undo2, CreditCard, CheckCircle2 } from "lucide-react";

export default function LeadsClient() {
  const [activeTab, setActiveTab] = useState<'all' | 'payment_pending' | 'approve_returns' | 'returned'>('all');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all your generated leads and return requests.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Leads', icon: Users },
            { id: 'payment_pending', label: 'Payment Pending', icon: CreditCard },
            { id: 'approve_returns', label: 'Approve Returns', icon: CheckCircle2 },
            { id: 'returned', label: 'All Returns', icon: Undo2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="transition-all duration-300 ease-in-out">
        {activeTab === 'all' && <AllLeadsTable />}
        {activeTab === 'payment_pending' && <AllLeadsTable defaultPaymentStatus="pending" />}
        {activeTab === 'approve_returns' && <ReturnLeadsTable defaultStatus="Approved" isAllLeads={true} />}
        {activeTab === 'returned' && <ReturnLeadsTable />}
      </div>
    </div>
  );
}

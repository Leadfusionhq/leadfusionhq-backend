"use client";

import { useState } from "react";
import AllLeadsTable from "./AllLeadsTable";
import ReturnLeadsTable from "./ReturnLeadsTable";
import { Users, Undo2 } from "lucide-react";

export default function LeadsClient() {
  const [activeTab, setActiveTab] = useState<'all' | 'returned'>('all');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all your generated leads and return requests.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Users size={16} />
            All Leads
          </button>
          <button
            onClick={() => setActiveTab('returned')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'returned'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Undo2 size={16} />
            Returned Leads
          </button>
        </div>
      </div>

      <div className="transition-all duration-300 ease-in-out">
        {activeTab === 'all' && <AllLeadsTable />}
        {activeTab === 'returned' && <ReturnLeadsTable />}
      </div>
    </div>
  );
}

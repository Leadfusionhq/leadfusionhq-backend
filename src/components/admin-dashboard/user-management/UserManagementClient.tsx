"use client";

import { useState } from "react";
import UserTable from "@/components/admin-dashboard/user-management/User/Users";
import AdminTable from "@/components/admin-dashboard/user-management/Admin/Admin";
import UnverifiedUsersTable from "@/components/admin-dashboard/user-management/User/UnverifiedUsers";
import { Users, ShieldCheck, UserX } from "lucide-react";

export default function UserManagementClient() {
    const [activeTab, setActiveTab] = useState<'users' | 'admins' | 'unverified'>('users');

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage users, admins, and permissions.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Users size={16} />
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('unverified')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'unverified'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <UserX size={16} />
                        Unverified
                    </button>
                    <button
                        onClick={() => setActiveTab('admins')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'admins'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <ShieldCheck size={16} />
                        Admins
                    </button>
                </div>
            </div>

            <div className="transition-all duration-300 ease-in-out">
                {activeTab === 'users' && <UserTable />}
                {activeTab === 'unverified' && <UnverifiedUsersTable />}
                {activeTab === 'admins' && <AdminTable />}
            </div>
        </div>
    );
}

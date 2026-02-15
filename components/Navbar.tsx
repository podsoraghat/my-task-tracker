'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User as UserIcon, LayoutGrid } from 'lucide-react';

export const Navbar: React.FC = () => {
    const { user, signOut } = useAuth();

    if (!user) return null;

    const userInitial = user.email ? user.email[0].toUpperCase() : 'U';

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                        <LayoutGrid className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-gray-900 tracking-tight">Task Tracker</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 pr-4 border-r border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-blue-100">
                            {userInitial}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900 leading-none">User</p>
                            <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

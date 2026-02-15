'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User as UserIcon, LayoutGrid } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const Navbar = () => {
    const { user } = useAuth();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/80">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                        <img src="/logo.svg" alt="Zive Logo" className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-bold text-gray-900 tracking-tight">
                        Zive <span className="text-blue-600 text-[10px] align-top px-1.5 py-0.5 bg-blue-50 rounded-full ml-1 font-bold">PRO</span>
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end border-r border-gray-100 pr-4">
                        <span className="text-xs font-bold text-gray-900">{user?.email?.split('@')[0]}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{user?.email}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                        <UserIcon className="w-4 h-4" />
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </nav>
    );
};

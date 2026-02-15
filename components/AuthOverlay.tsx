'use client';

import React, { useState } from 'react';
import { LayoutGrid, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const AuthOverlay: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (isSignUp && !email.toLowerCase().endsWith('@blufig.digital')) {
            setMessage({ type: 'error', text: 'Registration is restricted to @blufig.digital emails only.' });
            setLoading(false);
            return;
        }

        const { error } = isSignUp
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setMessage({ type: 'error', text: error.message });
            setLoading(false);
        } else if (isSignUp) {
            setMessage({ type: 'success', text: 'Success! Check your email for a confirmation link.' });
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 z-[100] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="flex flex-col items-center mb-6">
                    <div className="mb-4">
                        <img src="/logo.svg" alt="Zive Logo" className="w-16 h-16" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Zive PRO</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            placeholder="name@company.com"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-xl text-[11px] font-bold text-center border ${message.type === 'error' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
                        className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : 'New here? Create an Account'}
                    </button>
                </div>
            </div>
        </div>
    );
};

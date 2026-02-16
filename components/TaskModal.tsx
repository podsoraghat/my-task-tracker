'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { statusOptions } from '@/config/status';
import { Task } from '@/hooks/useTasks';
import { useAuth } from '@/context/AuthContext';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editTask: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSuccess, editTask }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        client_name: '',
        asset_type: '',
        task_name: '',
        start_date: new Date().toISOString().split('T')[0],
        status: 'In Progress',
        hours: '0',
        minutes: '0',
        asset_count: 1
    });

    useEffect(() => {
        const fetchData = async () => {
            const [{ data: cData }, { data: aData }] = await Promise.all([
                supabase.from('clients').select('name').order('name'),
                supabase.from('assets').select('name').order('name')
            ]);
            setClients(cData || []);
            setAssets(aData || []);
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    useEffect(() => {
        if (editTask) {
            const timeParts = editTask.time_taken.match(/(\d+)hr (\d+)min/);
            setFormData({
                client_name: editTask.client_name,
                asset_type: editTask.asset_type || '',
                task_name: editTask.task_name,
                start_date: editTask.start_date,
                status: editTask.status,
                hours: timeParts ? timeParts[1] : '0',
                minutes: timeParts ? timeParts[2] : '0',
                asset_count: editTask.asset_count || 1
            });
        } else {
            setFormData({
                client_name: '',
                asset_type: '',
                task_name: '',
                start_date: new Date().toISOString().split('T')[0],
                status: 'In Progress',
                hours: '0',
                minutes: '0',
                asset_count: 1
            });
        }
    }, [editTask, isOpen]);

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const time = `${formData.hours}hr ${formData.minutes}min`;
        const payload: any = {
            client_name: formData.client_name,
            asset_type: formData.asset_type,
            task_name: formData.task_name,
            start_date: formData.start_date,
            status: formData.status,
            time_taken: time,
            asset_count: parseInt(formData.asset_count.toString()) || 1,
        };

        if (!editTask) {
            payload.user_id = user?.id;
            payload.user_name = user?.email?.split('@')[0] || 'User';
        }

        const query = editTask
            ? supabase.from('tasks').update(payload).eq('id', editTask.id)
            : supabase.from('tasks').insert(payload);

        const { error: submitError } = await query;

        if (!submitError) {
            onSuccess();
            onClose();
        } else {
            setError(submitError.message);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">{editTask ? 'Edit Task' : 'Add New Task'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5 col-span-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Client Name</label>
                            <div className="relative">
                                <select
                                    required
                                    value={formData.client_name}
                                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
                                >
                                    <option value="">Select Client</option>
                                    {clients.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5 col-span-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Asset Type</label>
                            <div className="relative">
                                <select
                                    required
                                    value={formData.asset_type}
                                    onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
                                >
                                    <option value="">Select Asset Type</option>
                                    {assets.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5 col-span-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Task Name</label>
                            <input
                                type="text"
                                required
                                value={formData.task_name}
                                onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                placeholder="e.g. Frontend Development"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                            <input
                                type="date"
                                required
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</label>
                            <div className="relative">
                                <select
                                    required
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
                                >
                                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5 col-span-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Asset Count</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.asset_count}
                                onChange={(e) => setFormData({ ...formData, asset_count: e.target.value ? parseInt(e.target.value) : 1 })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                placeholder="1"
                            />
                        </div>

                        <div className="space-y-1.5 col-span-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Time Taken</label>
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.hours}
                                        onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Hrs</span>
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={formData.minutes}
                                        onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Min</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-500 text-center">
                            {error}
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-100 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editTask ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

'use client';

import React, { useMemo } from 'react';
import { Pencil, Trash2, Search, Filter, ArrowUpDown, MoreHorizontal, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Task, TimePreset } from '@/hooks/useTasks';
import { statusConfig } from '@/config/status';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface TaskTableProps {
    tasks: Task[];
    loading: boolean;
    filters: any;
    setFilters: (filters: any) => void;
    sort: any;
    setSort: (sort: any) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    navigateTime: (direction: 'prev' | 'next') => void;
    activeRange: { start: Date; end: Date } | null;
    referenceDate: Date;
    onReset: () => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
    tasks,
    loading,
    filters,
    setFilters,
    sort,
    setSort,
    onEdit,
    onDelete,
    navigateTime,
    activeRange,
    referenceDate,
    onReset
}) => {
    const { user } = useAuth();

    // Unique values for dropdowns
    const uniqueUsers = useMemo(() => Array.from(new Set(tasks.map(t => t.user_name))).sort(), [tasks]);
    const uniqueClients = useMemo(() => Array.from(new Set(tasks.map(t => t.client_name))).sort(), [tasks]);
    const uniqueAssets = useMemo(() => Array.from(new Set(tasks.map(t => t.asset_type))).filter(Boolean).sort(), [tasks]);

    const handleSort = (column: string) => {
        setSort({
            column,
            direction: sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc'
        });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-4">
            {/* Advanced Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks, clients, or users..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>

                    {/* Time Presets */}
                    <div className="flex bg-gray-50 p-1 rounded-lg gap-1 border border-gray-100">
                        {(['all', 'today', 'week', 'month', 'custom'] as TimePreset[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setFilters({ ...filters, preset: p })}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${filters.preset === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {/* Navigation Buttons for Presets */}
                    {filters.preset !== 'all' && filters.preset !== 'custom' && (
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigateTime('prev')} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-bold text-gray-600 min-w-[100px] text-center">
                                {filters.preset === 'today' && format(referenceDate, 'EEE, MMM d')}
                                {filters.preset === 'week' && `Week of ${format(activeRange?.start || referenceDate, 'MMM d')}`}
                                {filters.preset === 'month' && format(referenceDate, 'MMMM yyyy')}
                            </span>
                            <button onClick={() => navigateTime('next')} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-50">
                    {/* Dropdowns */}
                    <select
                        value={filters.user}
                        onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                        className="text-xs font-bold bg-transparent border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-gray-600"
                    >
                        <option value="">All Users</option>
                        {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>

                    <select
                        value={filters.client}
                        onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                        className="text-xs font-bold bg-transparent border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-gray-600"
                    >
                        <option value="">All Clients</option>
                        {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        className="text-xs font-bold bg-transparent border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-gray-600"
                    >
                        <option value="">All Assets</option>
                        {uniqueAssets.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="text-xs font-bold bg-transparent border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-gray-600"
                    >
                        <option value="">All Statuses</option>
                        {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* Custom Date Range Picker */}
                    {filters.preset === 'custom' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="text-xs bg-blue-50/50 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 text-blue-600 font-bold"
                            />
                            <span className="text-gray-300">to</span>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="text-xs bg-blue-50/50 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 text-blue-600 font-bold"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                {['user_name', 'client_name', 'asset_type', 'task_name', 'start_date', 'status', 'time_taken'].map((col) => (
                                    <th
                                        key={col}
                                        onClick={() => handleSort(col)}
                                        className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            {col.replace('_', ' ')}
                                            <ArrowUpDown className={`w-3 h-3 ${sort.column === col ? 'opacity-100' : 'opacity-30'}`} />
                                        </div>
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(8)].map((_, j) => (
                                            <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : tasks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm italic">
                                        No tasks found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                                                    {task.user_name?.substring(0, 2).toUpperCase() || 'SYS'}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">{task.user_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.client_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.asset_type || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{task.task_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(task.start_date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig[task.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono font-medium">{task.time_taken}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {user?.id === task.user_id && (
                                                    <>
                                                        <button onClick={() => onEdit(task)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => onDelete(task.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

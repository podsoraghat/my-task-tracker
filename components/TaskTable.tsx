'use client';

import React, { useMemo } from 'react';
import { Pencil, Trash2, Search, Filter, ArrowUpDown, MoreHorizontal, ChevronLeft, ChevronRight, Calendar, X, Clock } from 'lucide-react';
import { Task, TimePreset } from '@/hooks/useTasks';
import { statusConfig } from '@/config/status';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { TaskTimer } from './TaskTimer';

interface TaskTableProps {
    tasks: Task[];
    loading: boolean;
    filters: any;
    setFilters: (filters: any) => void;
    sort: any;
    setSort: (sort: any) => void;
    onDelete: (id: string) => void;
    navigateTime: (direction: 'prev' | 'next') => void;
    activeRange: { start: Date; end: Date } | null;
    referenceDate: Date;
    onReset: () => void;
    onStartTimer: (id: string) => void;
    onStopTimer: (id: string, calculatedSeconds: number) => void;
    onTaskClick?: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
    tasks,
    loading,
    filters,
    setFilters,
    sort,
    setSort,
    onDelete,
    navigateTime,
    activeRange,
    referenceDate,
    onReset,
    onStartTimer,
    onStopTimer,
    onTaskClick
}) => {
    const { user } = useAuth();

    // Unique values for dropdowns
    const uniqueUsers = useMemo(() => {
        const users = new Set<string>();
        tasks.forEach(t => {
            if (t.user_name) users.add(t.user_name);
            if (t.assigned_to_name) users.add(t.assigned_to_name);
        });
        return Array.from(users).sort();
    }, [tasks]);
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
            {/* Sticky Filter Bar Container */}
            <div className="sticky top-[160px] z-20 bg-gray-50/80 backdrop-blur-md py-2 -mx-2 px-2">
                {/* Advanced Filter Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
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
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold capitalize transition-all ${filters.preset === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {/* Navigation Buttons for Presets */}
                        {filters.preset !== 'all' && filters.preset !== 'custom' && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => navigateTime('prev')} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-[10px] font-bold text-gray-600 min-w-[80px] text-center">
                                    {filters.preset === 'today' && format(referenceDate, 'MMM d')}
                                    {filters.preset === 'week' && `Wk ${format(activeRange?.start || referenceDate, 'M/d')}`}
                                    {filters.preset === 'month' && format(referenceDate, 'MMM yyyy')}
                                </span>
                                <button onClick={() => navigateTime('next')} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                        {/* Dropdowns */}
                        <select
                            value={filters.user}
                            onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                            className="text-[10px] font-bold bg-transparent border border-gray-100 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-gray-600 max-w-[100px]"
                        >
                            <option value="">User</option>
                            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>

                        <select
                            value={filters.client}
                            onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                            className="text-[10px] font-bold bg-transparent border border-gray-100 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-gray-600 max-w-[100px]"
                        >
                            <option value="">Client</option>
                            {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="text-[10px] font-bold bg-transparent border border-gray-100 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-gray-600 max-w-[100px]"
                        >
                            <option value="">Asset</option>
                            {uniqueAssets.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="text-[10px] font-bold bg-transparent border border-gray-100 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-gray-600 max-w-[100px]"
                        >
                            <option value="">Status</option>
                            {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        {/* Custom Date Range Picker */}
                        {filters.preset === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    className="text-[10px] bg-blue-50/50 border-none rounded-lg px-2 py-1.5 outline-none text-blue-600 font-bold"
                                />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    className="text-[10px] bg-blue-50/50 border-none rounded-lg px-2 py-1.5 outline-none text-blue-600 font-bold"
                                />
                            </div>
                        )}

                        {/* Reset Button */}
                        <button
                            onClick={onReset}
                            className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 ml-auto"
                            title="Clear all filters"
                        >
                            <X className="w-3 h-3" />
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="w-full">
                    <table className="w-full text-left table-fixed">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th onClick={() => handleSort('assigned_to_name')} className="w-[12%] px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors">
                                    <div className="flex items-center gap-1 text-blue-600">Assigned To <ArrowUpDown className={`w-3 h-3 ${sort.column === 'assigned_to_name' ? 'opacity-100' : 'opacity-30'}`} /></div>
                                </th>
                                <th onClick={() => handleSort('user_name')} className="w-[10%] px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors">
                                    <div className="flex items-center gap-1">Assigned By <ArrowUpDown className={`w-3 h-3 ${sort.column === 'user_name' ? 'opacity-100' : 'opacity-30'}`} /></div>
                                </th>
                                <th onClick={() => handleSort('client_name')} className="w-[10%] px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors">
                                    <div className="flex items-center gap-1">Client <ArrowUpDown className={`w-3 h-3 ${sort.column === 'client_name' ? 'opacity-100' : 'opacity-30'}`} /></div>
                                </th>
                                <th onClick={() => handleSort('asset_type')} className="w-[10%] px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors">
                                    <div className="flex items-center gap-1">Type <ArrowUpDown className={`w-3 h-3 ${sort.column === 'asset_type' ? 'opacity-100' : 'opacity-30'}`} /></div>
                                </th>
                                <th onClick={() => handleSort('task_name')} className="w-[16%] px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors">
                                    <div className="flex items-center gap-1">Task Name <ArrowUpDown className={`w-3 h-3 ${sort.column === 'task_name' ? 'opacity-100' : 'opacity-30'}`} /></div>
                                </th>
                                <th onClick={() => handleSort('asset_count')} className="w-[6%] px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors text-center">
                                    <div className="flex items-center justify-center gap-1">Count <ArrowUpDown className={`w-3 h-3 ${sort.column === 'asset_count' ? 'opacity-100' : 'opacity-30'}`} /></div>
                                </th>
                                <th onClick={() => handleSort('start_date')} className="w-[10%] px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors">
                                    <div className="flex items-center gap-1">Date <ArrowUpDown className={`w-3 h-3 ${sort.column === 'start_date' ? 'opacity-100' : 'opacity-30'}`} /></div>
                                </th>
                                <th onClick={() => handleSort('status')} className="w-[10%] px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors">
                                    <div className="flex items-center gap-1">Status <ArrowUpDown className={`w-3 h-3 ${sort.column === 'status' ? 'opacity-100' : 'opacity-30'}`} /></div>
                                </th>
                                <th onClick={() => handleSort('time_taken')} className="w-[12%] px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors">
                                    <div className="flex items-center gap-1">Time <ArrowUpDown className={`w-3 h-3 ${sort.column === 'time_taken' ? 'opacity-100' : 'opacity-30'}`} /></div>
                                </th>
                                <th className="w-[4%] px-2 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(9)].map((_, j) => (
                                            <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : tasks.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm italic">
                                        No tasks found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((task) => (
                                    <tr
                                        key={task.id}
                                        onClick={() => onTaskClick?.(task)}
                                        className="hover:bg-gray-50/50 transition-colors group border-l-4 border-l-transparent hover:border-l-blue-500 cursor-pointer"
                                    >
                                        <td className="px-4 py-4 truncate">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
                                                    {task.assigned_to_name?.substring(0, 2).toUpperCase() || '??'}
                                                </div>
                                                <div className="text-sm font-bold text-blue-700 truncate" title={task.assigned_to_name || 'Unassigned'}>{task.assigned_to_name || 'Unassigned'}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 truncate">
                                            <div className="flex items-center gap-2 overflow-hidden grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                                <div className="shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-[9px]">
                                                    {task.user_name?.substring(0, 2).toUpperCase() || '??'}
                                                </div>
                                                <div className="text-xs font-medium text-gray-500 truncate" title={task.user_name}>{task.user_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 truncate text-sm text-gray-900" title={task.client_name}>{task.client_name}</td>
                                        <td className="px-4 py-4 truncate text-sm text-gray-500" title={task.asset_type}>{task.asset_type || '-'}</td>
                                        <td className="px-4 py-4 truncate text-sm text-gray-700 font-medium" title={task.task_name}>{task.task_name}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-900">{task.asset_count || 1}</span>
                                        </td>
                                        <td className="px-4 py-4 truncate text-[11px] text-gray-500">{formatDate(task.start_date)}</td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border block text-center truncate ${statusConfig[task.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`} title={task.status}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <TaskTimer
                                                totalSeconds={task.total_seconds}
                                                timerStart={task.timer_start}
                                                onStart={() => onStartTimer(task.id)}
                                                onStopWithConfirm={(calculatedSeconds) => onStopTimer(task.id, calculatedSeconds)}
                                                readonly={user?.id !== task.assigned_to}
                                            />
                                        </td>
                                        <td className="px-2 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Actions removed as per user request */}
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

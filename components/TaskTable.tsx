'use client';

import React from 'react';
import { Pencil, Trash2, Search, Filter, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { statusConfig } from '@/config/status';

interface TaskTableProps {
    tasks: Task[];
    loading: boolean;
    filters: any;
    setFilters: (filters: any) => void;
    sort: any;
    setSort: (sort: any) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
    tasks,
    loading,
    filters,
    setFilters,
    sort,
    setSort,
    onEdit,
    onDelete
}) => {
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tasks or clients..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="text-xs font-medium bg-gray-50 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

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
                                            <button onClick={() => onEdit(task)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onDelete(task.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

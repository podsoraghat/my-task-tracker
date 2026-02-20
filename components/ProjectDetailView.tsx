'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, CheckCircle2, ListTodo, History, LayoutGrid, Play, Square, Loader2 } from 'lucide-react';
import { Project, Task, ProjectMember, ActiveTimer } from '@/hooks/useTasks';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { statusConfig } from '@/config/status';
import { TaskTimer } from './TaskTimer';

interface ProjectDetailViewProps {
    project: Project | null;
    tasks: Task[];
    members: ProjectMember[];
    isOpen: boolean;
    onClose: () => void;
    activeTimerMap: Record<string, ActiveTimer | null>;
    onStartTimer: (taskId: string) => void;
    onStopTimer: (taskId: string, calculatedSeconds: number) => void;
    onTaskClick: (taskId: string) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
    project,
    tasks,
    members,
    isOpen,
    onClose,
    activeTimerMap,
    onStartTimer,
    onStopTimer,
    onTaskClick
}) => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'logs'>('tasks');
    const [timeLogs, setTimeLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mouseup', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mouseup', handleClickOutside);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && activeTab === 'logs' && project) {
            loadTimeLogs();
        }
    }, [isOpen, activeTab, project]);

    const loadTimeLogs = async () => {
        if (!project) return;
        setLoadingLogs(true);
        try {
            const { data, error } = await supabase
                .from('time_logs')
                .select(`
                    id,
                    user_id,
                    user_name,
                    seconds_logged,
                    logged_at,
                    task_id,
                    tasks!inner(
                        task_name,
                        project_id
                    )
                `)
                .eq('tasks.project_id', project.id)
                .order('logged_at', { ascending: false });

            if (!error && data) {
                setTimeLogs(data);
            }
        } catch (err) {
            console.error('Failed to load project time logs', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    if (!isOpen || !project) return null;

    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const StatusIcon = (statusConfig as any)[project.status]?.icon || LayoutGrid;

    const formatSeconds = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}hr ${m}min` : `${m}min`;
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                ref={modalRef}
                className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header Section */}
                <div className="flex flex-col bg-gray-50/50 border-b border-gray-100 shrink-0">
                    <div className="flex justify-between items-start p-6 pb-4">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {project.client_name}
                            </span>
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                {project.name}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${(statusConfig as any)[project.status]?.bg} ${(statusConfig as any)[project.status]?.color}`}>
                                <StatusIcon className="w-4 h-4" />
                                {project.status}
                            </div>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="px-6 pb-6 pt-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Client</label>
                                <p className="text-sm font-bold text-gray-900 mt-1">{project.client_name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assigned To</label>
                                <div className="flex -space-x-2 mt-1">
                                    {members.length > 0 ? members.slice(0, 5).map((m, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600" title={m.user_name || 'Member'}>
                                            {(m.user_name || 'U')[0].toUpperCase()}
                                        </div>
                                    )) : <span className="text-sm font-bold text-gray-400">Unassigned</span>}
                                    {members.length > 5 && (
                                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                                            +{members.length - 5}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assigned By</label>
                                <p className="text-sm font-bold text-gray-600 mt-1 px-2 py-1">System</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dates</label>
                                <p className="text-sm font-bold text-gray-900 mt-1">
                                    {format(parseISO(project.start_date), 'MMM d, yyyy')} - {format(parseISO(project.deadline), 'MMM d, yyyy')}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</label>
                                <div className="mt-1">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${(statusConfig as any)[project.status]?.bg} ${(statusConfig as any)[project.status]?.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-3 lg:col-span-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex justify-between">
                                    <span>Current Progress</span>
                                    <span className="text-blue-600">{progress}%</span>
                                </label>
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mt-2">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-6 border-t border-gray-100 bg-white">
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <ListTodo className="w-4 h-4" />
                            Tasks
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            Time Logs
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
                    {activeTab === 'tasks' && (
                        <div className="space-y-3">
                            {projectTasks.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-sm font-medium">
                                    No tasks are mapped to this project yet.
                                </div>
                            ) : (
                                projectTasks.map(task => {
                                    const TaskStatusIcon = (statusConfig as any)[task.status]?.icon || CheckCircle2;
                                    const isActive = !!activeTimerMap[task.id];
                                    return (
                                        <div
                                            key={task.id}
                                            className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                            onClick={() => onTaskClick(task.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${(statusConfig as any)[task.status]?.bg} ${(statusConfig as any)[task.status]?.color}`}>
                                                    <TaskStatusIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{task.task_name}</h4>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 font-medium">
                                                        <span>{format(parseISO(task.start_date), 'MMM d, yyyy')}</span>
                                                        <span>&bull;</span>
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[8px] text-gray-600">
                                                                {(task.assigned_to_name || task.user_name || 'U')[0].toUpperCase()}
                                                            </div>
                                                            {task.assigned_to_name || task.user_name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className={`text-xs font-bold ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                                                        {isActive ? (
                                                            <TaskTimer totalSeconds={task.total_seconds || 0} timerStart={activeTimerMap[task.id]!.startTime} onStart={() => { }} onStopWithConfirm={() => { }} readonly={true} />
                                                        ) : (
                                                            formatSeconds(task.total_seconds || 0)
                                                        )}
                                                    </span>
                                                </div>
                                                <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center z-10 w-8 h-8">
                                                    {/* Timer Control - Stops propagation so it doesn't open the modal */}
                                                    {task.status !== 'Completed' && task.status !== 'Canceled' && (
                                                        <button
                                                            onClick={() => isActive ? onStopTimer(task.id, 0) : onStartTimer(task.id)}
                                                            className={`p-1.5 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 z-20 relative ${isActive
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-200'
                                                                : 'bg-green-50 text-green-600 hover:bg-green-100 focus:ring-green-200'
                                                                }`}
                                                            title={isActive ? "Stop Timer" : "Start Timer"}
                                                        >
                                                            {isActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-4 relative">
                            {loadingLogs ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                </div>
                            ) : timeLogs.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-sm font-medium">
                                    No time has been logged on any tasks in this project yet.
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                    <table className="w-full text-left table-auto">
                                        <thead className="bg-gray-50/50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Task</th>
                                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">User</th>
                                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Date/Time</th>
                                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Logged</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {timeLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-xs font-bold text-gray-900 border-r border-gray-50">
                                                        {log.tasks?.task_name || 'Unknown Task'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-medium text-gray-600 border-r border-gray-50 flex items-center gap-2">
                                                        <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-[8px]">
                                                            {(log.user_name || 'U')[0].toUpperCase()}
                                                        </div>
                                                        {log.user_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-medium text-gray-500 border-r border-gray-50">
                                                        {format(parseISO(log.logged_at), 'MMM d, h:mm a')}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-black text-blue-600 text-right">
                                                        {formatSeconds(log.seconds_logged)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

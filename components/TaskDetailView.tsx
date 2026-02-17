'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { statusConfig, statusOptions } from '@/config/status';
import { InlineEdit } from './InlineEdit';

interface TimeLog {
    id: string;
    user_name: string;
    seconds_logged: number;
    logged_at: string;
    session_start: string | null;
    session_end: string | null;
}

interface TaskDetailViewProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
    onUpdate: () => void; // Callback to refresh parent list
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({ task, isOpen, onClose, onDelete, onUpdate }) => {
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
    const [projectName, setProjectName] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Options for dropdowns
    const [clients, setClients] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        const fetchOptions = async () => {
            const [{ data: cData }, { data: aData }, { data: pData }, { data: prData }] = await Promise.all([
                supabase.from('clients').select('name').order('name'),
                supabase.from('assets').select('name').order('name'),
                supabase.from('profiles').select('id, full_name').order('full_name'),
                supabase.from('projects').select('id, name, client_name').order('name')
            ]);
            setClients(cData || []);
            setAssets(aData || []);
            setProfiles(pData || []);
            setProjects(prData || []);
        };
        if (isOpen) fetchOptions();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && task) {
            loadTimeLogs();
        }
    }, [isOpen, task]);

    const loadTimeLogs = async () => {
        if (!task) return;
        setLoading(true);

        // Fetch time logs
        const { data: logsData, error: logsError } = await supabase
            .from('time_logs')
            .select('*')
            .eq('task_id', task.id)
            .order('logged_at', { ascending: false });

        if (!logsError && logsData) {
            setTimeLogs(logsData);
        }

        // Fetch project name if exists
        if (task.project_id) {
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('name')
                .eq('id', task.project_id)
                .single();

            if (!projectError && projectData) {
                setProjectName(projectData.name);
            } else {
                setProjectName('');
            }
        } else {
            setProjectName('');
        }

        setLoading(false);
    };

    const formatSeconds = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}hr ${m}min` : `${m}min`;
    };

    const handleUpdate = async (field: string, value: any) => {
        if (!task) return;

        const updates: any = { [field]: value };

        // Special handling for project change vs null
        if (field === 'project_id') {
            if (value) {
                const proj = projects.find(p => p.id === value);
                if (proj) {
                    updates.client_name = proj.client_name;
                    // Update local state for immediate feedback
                    setProjectName(proj.name);
                }
            } else {
                setProjectName('');
            }
        }

        // Special handling for assignee name update
        if (field === 'assigned_to') {
            const profile = profiles.find(p => p.id === value);
            if (profile) updates.assigned_to_name = profile.full_name;
        }

        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', task.id);

        if (!error) {
            onUpdate(); // Refresh parent
            // Also refresh local logs/project info if needed
            loadTimeLogs();
        } else {
            alert('Failed to update task: ' + error.message);
        }
    };

    const formatDateTime = (dateString: string) => {
        try {
            return format(parseISO(dateString), 'MMM d, yyyy • h:mm a');
        } catch {
            return dateString;
        }
    };

    if (!isOpen || !task) return null;

    const totalLoggedTime = timeLogs.reduce((sum, log) => sum + log.seconds_logged, 0);

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800">Task Details</h2>
                            <p className="text-xs text-gray-500 font-medium">Complete overview and time logs</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-white/50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Task Information */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                        <h3 className="text-lg font-black text-gray-800 mb-4">Task Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Task Name</label>
                                <InlineEdit
                                    value={task.task_name}
                                    onSave={(val) => handleUpdate('task_name', val)}
                                    className="mt-1"
                                    inputClassName="text-sm font-bold text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Project</label>
                                <InlineEdit
                                    type="select"
                                    value={task.project_id || ''}
                                    displayValue={projectName || 'No Project'}
                                    options={[
                                        { label: 'No Project', value: '' },
                                        ...projects.map(p => ({ label: p.name, value: p.id }))
                                    ]}
                                    onSave={(val) => handleUpdate('project_id', val || null)}
                                    className="mt-1"
                                    inputClassName="text-sm font-bold text-blue-600"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Client</label>
                                <InlineEdit
                                    type="select"
                                    value={task.client_name}
                                    options={clients.map(c => ({ label: c.name, value: c.name }))}
                                    onSave={(val) => handleUpdate('client_name', val)}
                                    className="mt-1"
                                    inputClassName="text-sm font-bold text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Asset Type</label>
                                <InlineEdit
                                    type="select"
                                    value={task.asset_type || ''}
                                    options={assets.map(a => ({ label: a.name, value: a.name }))}
                                    onSave={(val) => handleUpdate('asset_type', val)}
                                    className="mt-1"
                                    inputClassName="text-sm font-bold text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Asset Count</label>
                                <InlineEdit
                                    type="number"
                                    value={task.asset_count || 1}
                                    onSave={(val) => handleUpdate('asset_count', val)}
                                    className="mt-1"
                                    inputClassName="text-sm font-bold text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assigned To</label>
                                <InlineEdit
                                    type="select"
                                    value={task.assigned_to || ''}
                                    displayValue={task.assigned_to_name || 'Unassigned'}
                                    options={[
                                        { label: 'Unassigned', value: '' },
                                        ...profiles.map(p => ({ label: p.full_name, value: p.id }))
                                    ]}
                                    onSave={(val) => handleUpdate('assigned_to', val)}
                                    className="mt-1"
                                    inputClassName="text-sm font-bold text-blue-600"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assigned By</label>
                                <p className="text-sm font-bold text-gray-600 mt-1 px-2 py-1">{task.user_name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                                <InlineEdit
                                    type="date"
                                    value={task.start_date}
                                    displayValue={format(parseISO(task.start_date), 'MMM d, yyyy')}
                                    onSave={(val) => handleUpdate('start_date', val)}
                                    className="mt-1"
                                    inputClassName="text-sm font-bold text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</label>
                                <InlineEdit
                                    type="select"
                                    value={task.status}
                                    options={statusOptions.map(s => ({ label: s, value: s }))}
                                    onSave={(val) => handleUpdate('status', val)}
                                    className="mt-1"
                                    inputClassName={`text-sm font-bold ${statusConfig[task.status] || 'bg-gray-100 text-gray-800'} px-2 py-0.5 rounded-full`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Time Summary */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                        <h3 className="text-lg font-black text-gray-800 mb-4">Time Summary</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Time</p>
                                <p className="text-2xl font-black text-green-600 mt-2">{task.time_taken || '0hr 0min'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sessions</p>
                                <p className="text-2xl font-black text-blue-600 mt-2">{timeLogs.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Logged Time</p>
                                <p className="text-2xl font-black text-purple-600 mt-2">{formatSeconds(totalLoggedTime)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Time Logs */}
                    <div>
                        <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Time Logs
                        </h3>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : timeLogs.length === 0 ? (
                            <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-bold text-gray-400">No time logs yet</p>
                                <p className="text-xs text-gray-400 mt-1">Start the timer to create your first log entry</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {timeLogs.map((log) => (
                                    <div key={log.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{log.user_name}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDateTime(log.logged_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-blue-600">{formatSeconds(log.seconds_logged)}</p>
                                                {log.session_start && log.session_end && (
                                                    <p className="text-xs text-gray-400 font-medium">
                                                        {format(parseISO(log.session_start), 'h:mm a')} → {format(parseISO(log.session_end), 'h:mm a')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this task?')) {
                                onDelete();
                                onClose();
                            }
                        }}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Task
                    </button>
                </div>
            </div>
        </div>
    );
};

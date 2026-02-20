'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, User, Calendar, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { statusConfig, statusOptions } from '@/config/status';
import { InlineEdit } from './InlineEdit';
import { MultiSelect } from './MultiSelect';
import { useAuth } from '@/context/AuthContext';
import { Save } from 'lucide-react';

interface TimeLog {
    id: string;
    user_id: string;
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
    const { user } = useAuth();

    // Editing State
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editHours, setEditHours] = useState('0');
    const [editMinutes, setEditMinutes] = useState('0');

    // Options for dropdowns
    const [clients, setClients] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        const fetchOptions = async () => {
            // ... existing fetch logic
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

    // Handle click outside to close
    const modalRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            // Using 'mousedown' can race with onBlur. 'mouseup' or 'click' is safer for saving data on close.
            document.addEventListener('mouseup', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mouseup', handleClickOutside);
        };
    }, [isOpen, onClose]);

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

        // Special handling for assignments (many-to-many)
        if (field === 'assignees') {
            const newAssigneeIds: string[] = value;

            // 1. Delete existing assignments
            await supabase.from('task_assignments').delete().eq('task_id', task.id);

            // 2. Insert new assignments
            if (newAssigneeIds.length > 0) {
                const assignments = newAssigneeIds.map(userId => ({
                    task_id: task.id,
                    user_id: userId
                }));
                await supabase.from('task_assignments').insert(assignments);
            }

            // Update legacy fields for compatibility
            const primaryAssigneeId = newAssigneeIds.length > 0 ? newAssigneeIds[0] : null;
            const primaryProfile = profiles.find(p => p.id === primaryAssigneeId);

            await supabase.from('tasks').update({
                assigned_to: primaryAssigneeId,
                assigned_to_name: primaryProfile?.full_name || null
            }).eq('id', task.id);

            onUpdate();
            return;
        }

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

    const handleEditLog = (log: TimeLog) => {
        setEditingLogId(log.id);
        const h = Math.floor(log.seconds_logged / 3600);
        const m = Math.floor((log.seconds_logged % 3600) / 60);
        setEditHours(h.toString());
        setEditMinutes(m.toString());
    };

    const handleSaveLog = async () => {
        if (!editingLogId || !task) return;

        const h = parseInt(editHours) || 0;
        const m = parseInt(editMinutes) || 0;

        if (h < 0 || m < 0) {
            alert("Time cannot be negative");
            return;
        }

        let totalSeconds = h * 3600 + m * 60;

        // 1. Update the time log
        const { error: updateError } = await supabase
            .from('time_logs')
            .update({ seconds_logged: totalSeconds })
            .eq('id', editingLogId);

        if (updateError) {
            alert('Failed to update log: ' + updateError.message);
            return;
        }

        // 2. Recalculate total time for the task
        recalculateTaskTotals();
    };

    const handleDeleteLog = async (logId: string) => {
        if (!confirm('Are you sure you want to delete this time entry?')) return;

        const { error } = await supabase.from('time_logs').delete().eq('id', logId);

        if (error) {
            alert('Failed to delete log: ' + error.message);
        } else {
            recalculateTaskTotals();
        }
    };

    const recalculateTaskTotals = async () => {
        if (!task) return;

        // Fetch all logs for this task
        const { data: logs } = await supabase
            .from('time_logs')
            .select('seconds_logged')
            .eq('task_id', task.id);

        const newTotalSeconds = (logs || []).reduce((sum, log) => sum + log.seconds_logged, 0);
        const newTimeTaken = formatSeconds(newTotalSeconds);

        // Update task
        await supabase
            .from('tasks')
            .update({
                total_seconds: newTotalSeconds,
                time_taken: newTimeTaken
            })
            .eq('id', task.id);

        setEditingLogId(null);
        loadTimeLogs();
        onUpdate();
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
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col">
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
                                <div className="mt-1">
                                    <MultiSelect
                                        options={profiles.map(p => ({ label: p.full_name, value: p.id }))}
                                        selectedValues={task.assignees?.map(a => a.user_id) || []}
                                        onChange={(vals) => handleUpdate('assignees', vals)}
                                        placeholder="Unassigned"
                                    />
                                </div>
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
                                    <div key={log.id} className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
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
                                                {editingLogId === log.id ? (
                                                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-blue-200">
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                value={editHours}
                                                                onChange={(e) => setEditHours(e.target.value)}
                                                                className={`w-12 px-1 py-1 text-right font-bold border rounded focus:ring-2 outline-none ${(parseInt(editHours) < 0)
                                                                    ? 'border-red-500 focus:ring-red-200'
                                                                    : 'focus:ring-blue-500'
                                                                    }`}
                                                            />
                                                            <span className="text-xs font-bold text-gray-500">hr</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                value={editMinutes}
                                                                onChange={(e) => setEditMinutes(e.target.value)}
                                                                className={`w-12 px-1 py-1 text-right font-bold border rounded focus:ring-2 outline-none ${(parseInt(editMinutes) < 0)
                                                                    ? 'border-red-500 focus:ring-red-200'
                                                                    : 'focus:ring-blue-500'
                                                                    }`}
                                                            />
                                                            <span className="text-xs font-bold text-gray-500">min</span>
                                                        </div>
                                                        <button
                                                            onClick={handleSaveLog}
                                                            disabled={(parseInt(editHours) < 0) || (parseInt(editMinutes) < 0)}
                                                            className={`p-1 text-white rounded transition-colors ${(parseInt(editHours) < 0) || (parseInt(editMinutes) < 0)
                                                                ? 'bg-gray-300 cursor-not-allowed'
                                                                : 'bg-blue-600 hover:bg-blue-700'
                                                                }`}
                                                            title="Save"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingLogId(null)}
                                                            className="p-1 text-gray-400 hover:text-gray-600"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-lg font-black text-blue-600">{formatSeconds(log.seconds_logged)}</p>
                                                        {user?.id === log.user_id && (
                                                            <div className="flex gap-2 justify-end mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEditLog(log)}
                                                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                                                    title="Edit Time"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteLog(log.id)}
                                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                                    title="Delete Entry"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
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
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
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

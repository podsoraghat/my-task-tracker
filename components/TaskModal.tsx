'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { statusOptions } from '@/config/status';
import { Task } from '@/hooks/useTasks';
import { useAuth } from '@/context/AuthContext';
import { MultiSelect } from './MultiSelect';

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
    const [profiles, setProfiles] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        client_name: '',
        asset_type: '',
        task_name: '',
        start_date: new Date().toISOString().split('T')[0],
        status: 'In Progress',
        hours: '0',
        minutes: '0',
        asset_count: 1,
        // assigned_to: '', // Deprecated in favor of multi-select
        assignees: [] as string[],
        project_id: ''
    });

    useEffect(() => {
        const fetchData = async () => {
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
                asset_count: editTask.asset_count || 1,
                assignees: editTask.assignees?.map(a => a.user_id) || (editTask.assigned_to ? [editTask.assigned_to] : []),
                project_id: editTask.project_id || ''
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
                asset_count: 1,
                assignees: user?.id ? [user.id] : [], // Default to self
                project_id: ''
            });
        }
    }, [editTask, isOpen, user?.id]);

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const time = `${formData.hours}hr ${formData.minutes}min`;

        // Determine primary assignee for legacy compatibility (first selected)
        const primaryAssigneeId = formData.assignees.length > 0 ? formData.assignees[0] : null;
        const primaryAssigneeProfile = profiles.find(p => p.id === primaryAssigneeId);
        const primaryAssigneeName = primaryAssigneeProfile ? primaryAssigneeProfile.full_name : null;

        const payload: any = {
            client_name: formData.client_name,
            asset_type: formData.asset_type,
            task_name: formData.task_name,
            start_date: formData.start_date,
            status: formData.status,
            time_taken: time,
            asset_count: parseInt(formData.asset_count.toString()) || 1,
            assigned_to: primaryAssigneeId, // Legacy support
            assigned_to_name: primaryAssigneeName, // Legacy support
            project_id: formData.project_id || null
        };

        if (!editTask) {
            payload.user_id = user?.id; // Creator
            payload.user_name = user?.email?.split('@')[0] || 'User'; // Creator
        }

        let taskId = editTask?.id;

        if (editTask) {
            const { error: updateError } = await supabase.from('tasks').update(payload).eq('id', editTask.id);
            if (updateError) {
                setError(updateError.message);
                setLoading(false);
                return;
            }
        } else {
            const { data: newTask, error: insertError } = await supabase.from('tasks').insert(payload).select().single();
            if (insertError) {
                setError(insertError.message);
                setLoading(false);
                return;
            }
            taskId = newTask.id;
        }

        // Handle Assignments (Delete all and re-insert for simplicity)
        if (taskId) {
            // 1. Delete existing assignments
            await supabase.from('task_assignments').delete().eq('task_id', taskId);

            // 2. Insert new assignments
            if (formData.assignees.length > 0) {
                const assignments = formData.assignees.map(userId => ({
                    task_id: taskId,
                    user_id: userId
                }));
                const { error: assignError } = await supabase.from('task_assignments').insert(assignments);
                if (assignError) console.error('Error saving assignments:', assignError);
            }
        }

        onSuccess();
        onClose();
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">{editTask ? 'Edit Task Details' : 'Assign New Task'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Project Selection */}
                        <div className="space-y-1.5 col-span-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest text-blue-600">Link to Project</label>
                            <div className="relative">
                                <select
                                    value={formData.project_id}
                                    onChange={async (e) => {
                                        const projId = e.target.value;
                                        const proj = projects.find(p => p.id === projId);
                                        const updates: any = { project_id: projId };

                                        if (proj) {
                                            updates.client_name = proj.client_name;
                                            // Fetch project members and auto-assign
                                            const { data: members } = await supabase.from('project_members').select('user_id').eq('project_id', projId);
                                            if (members && members.length > 0) {
                                                updates.assignees = members.map(m => m.user_id);
                                            }
                                        }
                                        setFormData({ ...formData, ...updates });
                                    }}
                                    className="w-full px-4 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer font-bold"
                                >
                                    <option value="">No Project (General Task)</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.client_name})</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                            </div>
                        </div>
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
                            <MultiSelect
                                label="Assign To"
                                placeholder="Select users..."
                                options={profiles.map(p => ({ label: p.full_name, value: p.id }))}
                                selectedValues={formData.assignees}
                                onChange={(vals) => setFormData({ ...formData, assignees: vals })}
                            />
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
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Add Time Manually (Optional)</label>
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
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editTask ? 'Update Assignment' : 'Assign Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

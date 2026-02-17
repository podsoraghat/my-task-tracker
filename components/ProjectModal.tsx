'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown, UserPlus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editProject?: any;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSuccess, editProject }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        client_name: '',
        start_date: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Active'
    });

    const [selectedMembers, setSelectedMembers] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [{ data: cData }, { data: pData }] = await Promise.all([
                supabase.from('clients').select('name').order('name'),
                supabase.from('profiles').select('id, full_name').order('full_name')
            ]);
            setClients(cData || []);
            setProfiles(pData || []);
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    useEffect(() => {
        if (editProject && isOpen) {
            setFormData({
                name: editProject.name,
                client_name: editProject.client_name,
                start_date: editProject.start_date,
                deadline: editProject.deadline,
                status: editProject.status
            });
            // Fetch current members
            const fetchMembers = async () => {
                const { data } = await supabase.from('project_members').select('user_id, user_name').eq('project_id', editProject.id);
                if (data) setSelectedMembers(data.map(m => ({ id: m.user_id, name: m.user_name || '' })));
            };
            fetchMembers();
        } else {
            setFormData({
                name: '',
                client_name: '',
                start_date: new Date().toISOString().split('T')[0],
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'Active'
            });
            setSelectedMembers([{ id: user?.id || '', name: user?.email?.split('@')[0] || 'Me' }]);
        }
    }, [editProject, isOpen, user]);

    const handleAddMember = (profileId: string) => {
        const profile = profiles.find(p => p.id === profileId);
        if (profile && !selectedMembers.find(m => m.id === profileId)) {
            setSelectedMembers([...selectedMembers, { id: profile.id, name: profile.full_name }]);
        }
    };

    const handleRemoveMember = (id: string) => {
        setSelectedMembers(selectedMembers.filter(m => m.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const projectPayload = {
            ...formData,
            created_by: user?.id
        };

        try {
            const { data: projData, error: projError } = editProject
                ? await supabase.from('projects').update(projectPayload).eq('id', editProject.id).select().single()
                : await supabase.from('projects').insert(projectPayload).select().single();

            if (projError) throw projError;

            // Update members
            if (editProject) {
                await supabase.from('project_members').delete().eq('project_id', editProject.id);
            }

            const memberPayloads = selectedMembers.map(m => ({
                project_id: projData.id,
                user_id: m.id,
                user_name: m.name
            }));

            const { error: memError } = await supabase.from('project_members').insert(memberPayloads);
            if (memError) throw memError;

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">{editProject ? 'Edit Project' : 'Launch New Project'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5 col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 font-bold"
                                placeholder="e.g. Q1 Marketing Campaign"
                            />
                        </div>

                        <div className="space-y-1.5 col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Linked Client</label>
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

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kickoff Date</label>
                            <input
                                type="date"
                                required
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-blue-600">Deadline</label>
                            <input
                                type="date"
                                required
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                className="w-full px-4 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 font-bold text-blue-700"
                            />
                        </div>

                        {/* Member Management */}
                        <div className="space-y-3 col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Members</label>

                            <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-50 rounded-xl border border-gray-100 min-h-[50px]">
                                {selectedMembers.map(m => (
                                    <div key={m.id} className="flex items-center gap-2 bg-white border border-gray-100 px-3 py-1.5 rounded-lg shadow-sm animate-in zoom-in-95 duration-200">
                                        <span className="text-xs font-bold text-gray-700">{m.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMember(m.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {selectedMembers.length === 0 && <span className="text-xs text-gray-400 italic py-1">No members added yet...</span>}
                            </div>

                            <div className="relative">
                                <select
                                    className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
                                    onChange={(e) => {
                                        handleAddMember(e.target.value);
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">+ Add Team Member</option>
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                    ))}
                                </select>
                                <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-500 text-center uppercase tracking-tighter">
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-100 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editProject ? 'Update Project' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

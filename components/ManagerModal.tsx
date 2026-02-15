'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ManagerModalProps {
    title: string;
    table: 'clients' | 'assets';
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export const ManagerModal: React.FC<ManagerModalProps> = ({ title, table, isOpen, onClose, onUpdate }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    const loadItems = async () => {
        setLoading(true);
        const { data } = await supabase.from(table).select('*').order('name');
        setItems(data || []);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) loadItems();
    }, [isOpen]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;
        await supabase.from(table).insert({ name: newItemName.trim() });
        setNewItemName('');
        loadItems();
        onUpdate();
    };

    const handleEdit = async (id: string, oldName: string) => {
        const newName = prompt(`Rename ${title}:`, oldName);
        if (!newName || newName === oldName) return;
        await supabase.from(table).update({ name: newName }).eq('id', id);
        loadItems();
        onUpdate();
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"?`)) return;
        await supabase.from(table).delete().eq('id', id);
        loadItems();
        onUpdate();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">Manage {title}s</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-auto">
                    <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder={`New ${title} name...`}
                        />
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                            Add
                        </button>
                    </form>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Existing {title}s</p>
                        <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                            {items.length === 0 ? (
                                <p className="p-4 text-center text-sm text-gray-400 italic">No {title}s found.</p>
                            ) : (
                                items.map(item => (
                                    <div key={item.id} className="group flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors">
                                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(item.id, item.name)} className="p-1 text-gray-400 hover:text-blue-500 rounded-md hover:bg-blue-50">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id, item.name)} className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

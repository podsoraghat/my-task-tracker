'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, FileDown, Calendar, Check, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
    startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    addDays, addWeeks, addMonths, isWithinInterval, parseISO, format
} from 'date-fns';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
    const [clients, setClients] = useState<string[]>([]);
    const [assets, setAssets] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Filters
    const [preset, setPreset] = useState<'today' | 'week' | 'month' | 'custom'>('month');
    const [referenceDate, setReferenceDate] = useState(new Date());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchMetaData();
        }
    }, [isOpen]);

    const fetchMetaData = async () => {
        setLoading(true);
        try {
            const [{ data: cData }, { data: aData }] = await Promise.all([
                supabase.from('clients').select('name').order('name'),
                supabase.from('assets').select('name').order('name')
            ]);

            const clientList = (cData || []).map(c => c.name);
            const assetList = (aData || []).map(a => a.name);

            setClients(clientList);
            setAssets(assetList);
            setSelectedClients(clientList); // Default all selected
            setSelectedAssets(assetList);   // Default all selected
        } catch (err) {
            console.error('Error fetching metadata:', err);
        } finally {
            setLoading(false);
        }
    };

    const navigateTime = (direction: 'prev' | 'next') => {
        const amount = direction === 'next' ? 1 : -1;
        if (preset === 'today') setReferenceDate(prev => addDays(prev, amount));
        if (preset === 'week') setReferenceDate(prev => addWeeks(prev, amount));
        if (preset === 'month') setReferenceDate(prev => addMonths(prev, amount));
    };

    const activeRange = useMemo(() => {
        if (preset === 'today') return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) };
        if (preset === 'week') return { start: startOfWeek(referenceDate), end: endOfWeek(referenceDate) };
        if (preset === 'month') return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
        if (preset === 'custom' && startDate && endDate) {
            return { start: startOfDay(parseISO(startDate)), end: endOfDay(parseISO(endDate)) };
        }
        return null;
    }, [preset, referenceDate, startDate, endDate]);

    const handleToggleClient = (name: string) => {
        setSelectedClients(prev =>
            prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
        );
    };

    const handleToggleAsset = (name: string) => {
        setSelectedAssets(prev =>
            prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
        );
    };

    const generateCSV = async () => {
        if (!activeRange) {
            alert('Please select a valid date range');
            return;
        }

        setGenerating(true);
        try {
            // Fetch tasks for the range
            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('*')
                .gte('start_date', format(activeRange.start, 'yyyy-MM-dd'))
                .lte('start_date', format(activeRange.end, 'yyyy-MM-dd'));

            if (error) throw error;

            // Filter locally by client/asset
            const filtered = (tasks || []).filter(t =>
                selectedClients.includes(t.client_name) &&
                selectedAssets.includes(t.asset_type)
            );

            // Grouping Logic
            const reportData: any = {};
            filtered.forEach(task => {
                if (!reportData[task.client_name]) {
                    reportData[task.client_name] = {};
                }
                if (!reportData[task.client_name][task.asset_type]) {
                    reportData[task.client_name][task.asset_type] = { count: 0, totalMinutes: 0 };
                }

                reportData[task.client_name][task.asset_type].count += (task.asset_count || 1);

                // Parse time
                const hrs = parseInt(task.time_taken.match(/(\d+)hr/)?.[1] || '0');
                const mins = parseInt(task.time_taken.match(/(\d+)min/)?.[1] || '0');
                reportData[task.client_name][task.asset_type].totalMinutes += (hrs * 60) + mins;
            });

            // Build CSV Content
            let csv = 'Client Name,Asset Type,Number of Assets,Total Time Taken\n';

            Object.keys(reportData).sort().forEach(client => {
                const assets = reportData[client];
                Object.keys(assets).sort().forEach(assetType => {
                    const data = assets[assetType];
                    const h = Math.floor(data.totalMinutes / 60);
                    const m = data.totalMinutes % 60;
                    const timeStr = `${h}hr ${m}min`;
                    csv += `"${client}","${assetType}",${data.count},"${timeStr}"\n`;
                });
                csv += '\n'; // Add spacing between clients for readability
            });

            // Download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `Zive_Report_${format(activeRange.start, 'yyyy-MM-dd')}_to_${format(activeRange.end, 'yyyy-MM-dd')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            onClose();
        } catch (err) {
            console.error('Error generating report:', err);
            alert('Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <FileDown className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Export Report</h3>
                            <p className="text-xs text-gray-500 font-medium">Configure and download your summary</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Date Range Selection */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            1. Select Date Range
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                            {/* Presets */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Preset</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['today', 'week', 'month', 'custom'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPreset(p)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${preset === p
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                                                }`}
                                        >
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Range Controller */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Selection</label>
                                {preset !== 'custom' ? (
                                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200">
                                        <button onClick={() => navigateTime('prev')} className="p-1 hover:bg-gray-50 rounded"><ChevronLeft className="w-4 h-4" /></button>
                                        <span className="text-sm font-bold text-gray-700 capitalize">
                                            {preset === 'today' && format(referenceDate, 'EEE, MMM d, yyyy')}
                                            {preset === 'week' && `Week of ${format(startOfWeek(referenceDate), 'MMM d')}`}
                                            {preset === 'month' && format(referenceDate, 'MMMM yyyy')}
                                        </span>
                                        <button onClick={() => navigateTime('next')} className="p-1 hover:bg-gray-50 rounded"><ChevronRight className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-white border border-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100 w-full"
                                        />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-white border border-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100 w-full"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Multi-Select Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Clients */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-purple-500" />
                                    2. Clients
                                </h4>
                                <button
                                    onClick={() => setSelectedClients(selectedClients.length === clients.length ? [] : clients)}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase"
                                >
                                    {selectedClients.length === clients.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="h-48 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-1 bg-gray-50/30">
                                {clients.map(client => (
                                    <button
                                        key={client}
                                        onClick={() => handleToggleClient(client)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${selectedClients.includes(client) ? 'bg-white shadow-sm border border-gray-100 text-blue-700' : 'text-gray-500 hover:bg-white'
                                            }`}
                                    >
                                        <span>{client}</span>
                                        {selectedClients.includes(client) && <Check className="w-3 h-3 text-blue-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Assets */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-orange-500" />
                                    3. Asset Types
                                </h4>
                                <button
                                    onClick={() => setSelectedAssets(selectedAssets.length === assets.length ? [] : assets)}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase"
                                >
                                    {selectedAssets.length === assets.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="h-48 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-1 bg-gray-50/30">
                                {assets.map(asset => (
                                    <button
                                        key={asset}
                                        onClick={() => handleToggleAsset(asset)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${selectedAssets.includes(asset) ? 'bg-white shadow-sm border border-gray-100 text-blue-700' : 'text-gray-500 hover:bg-white'
                                            }`}
                                    >
                                        <span>{asset}</span>
                                        {selectedAssets.includes(asset) && <Check className="w-3 h-3 text-blue-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-medium">
                        {selectedClients.length}/{clients.length} Clients, {selectedAssets.length}/{assets.length} Assets selected
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={generateCSV}
                            disabled={generating || selectedClients.length === 0 || selectedAssets.length === 0}
                            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
                        >
                            {generating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4" />
                                    Generate CSV
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

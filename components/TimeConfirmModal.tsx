'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Check } from 'lucide-react';

interface TimeConfirmModalProps {
    isOpen: boolean;
    calculatedSeconds: number;
    onConfirm: (adjustedSeconds: number) => void;
    onCancel: () => void;
}

export const TimeConfirmModal: React.FC<TimeConfirmModalProps> = ({
    isOpen,
    calculatedSeconds,
    onConfirm,
    onCancel
}) => {
    const [hours, setHours] = useState('0');
    const [minutes, setMinutes] = useState('0');

    useEffect(() => {
        if (isOpen) {
            const h = Math.floor(calculatedSeconds / 3600);
            const m = Math.floor((calculatedSeconds % 3600) / 60);
            setHours(h.toString());
            setMinutes(m.toString());
        }
    }, [isOpen, calculatedSeconds]);

    const handleConfirm = () => {
        const totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60;
        onConfirm(totalSeconds);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-black text-gray-800">Confirm Time</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-white/50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Calculated Time</p>
                        <p className="text-2xl font-black text-blue-900">
                            {Math.floor(calculatedSeconds / 3600)}hr {Math.floor((calculatedSeconds % 3600) / 60)}min
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                            Adjust Time (Optional)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">Hours</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">Minutes</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={minutes}
                                    onChange={(e) => setMinutes(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <p className="text-xs text-amber-700 font-medium">
                            💡 <strong>Tip:</strong> You can adjust the time if you took breaks or need to round up/down.
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Confirm & Save
                    </button>
                </div>
            </div>
        </div>
    );
};

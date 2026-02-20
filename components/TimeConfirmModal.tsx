'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Check } from 'lucide-react';

interface TimeConfirmModalProps {
    isOpen: boolean;
    calculatedSeconds: number;
    onConfirm: (adjustedSeconds: number) => void;
    onDiscard: () => void;
    onCancel: () => void;
}

export const TimeConfirmModal: React.FC<TimeConfirmModalProps> = ({
    isOpen,
    calculatedSeconds,
    onConfirm,
    onDiscard,
    onCancel
}) => {
    const [hours, setHours] = useState('0');
    const [minutes, setMinutes] = useState('0');
    const [errors, setErrors] = useState({ hours: false, minutes: false });

    useEffect(() => {
        if (isOpen) {
            const h = Math.floor(calculatedSeconds / 3600);
            const m = Math.floor((calculatedSeconds % 3600) / 60);
            setHours(h.toString());
            setMinutes(m.toString());
            setErrors({ hours: false, minutes: false });
        }
    }, [isOpen, calculatedSeconds]);

    const validate = (type: 'hours' | 'minutes', value: string) => {
        const num = parseInt(value);
        const isError = isNaN(num) || num < 0;
        setErrors(prev => ({ ...prev, [type]: isError }));
        return isError;
    };

    const handleConfirm = () => {
        const h = parseInt(hours);
        const m = parseInt(minutes);

        if (isNaN(h) || h < 0 || isNaN(m) || m < 0) return;

        const totalSeconds = h * 3600 + m * 60;
        onConfirm(totalSeconds);
    };

    const hasError = errors.hours || errors.minutes;

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
                                    value={hours}
                                    onChange={(e) => {
                                        setHours(e.target.value);
                                        validate('hours', e.target.value);
                                    }}
                                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-lg font-bold text-gray-900 outline-none transition-all ${errors.hours
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                                        }`}
                                />
                                {errors.hours && <p className="text-[10px] font-bold text-red-500">Time cannot be negative</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">Minutes</label>
                                <input
                                    type="number"
                                    value={minutes}
                                    onChange={(e) => {
                                        setMinutes(e.target.value);
                                        validate('minutes', e.target.value);
                                    }}
                                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-lg font-bold text-gray-900 outline-none transition-all ${errors.minutes
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                                        }`}
                                />
                                {errors.minutes && <p className="text-[10px] font-bold text-red-500">Time cannot be negative</p>}
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
                        onClick={onDiscard}
                        className="flex-1 px-4 py-3 bg-red-50 text-red-600 border-2 border-transparent hover:border-red-100 rounded-xl font-bold hover:bg-red-100 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={hasError}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${hasError
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                            }`}
                    >
                        <Check className="w-4 h-4" />
                        Confirm & Save
                    </button>
                </div>
            </div>
        </div>
    );
};

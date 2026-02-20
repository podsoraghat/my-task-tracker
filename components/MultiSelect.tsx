'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';

export interface Option {
    value: string;
    label: string;
    avatar?: string;
}

interface MultiSelectProps {
    options: Option[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    selectedValues,
    onChange,
    placeholder = 'Select options...',
    label,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value: string) => {
        const newSelected = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newSelected);
    };

    const removeValue = (e: React.MouseEvent, value: string) => {
        e.stopPropagation();
        onChange(selectedValues.filter(v => v !== value));
    };

    const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">{label}</label>}

            <div
                className="w-full min-h-[42px] px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 cursor-pointer flex flex-wrap gap-2 items-center transition-all shadow-sm"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOptions.length === 0 && (
                    <span className="text-gray-400">{placeholder}</span>
                )}

                {selectedOptions.map(option => (
                    <div key={option.value} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg flex items-center gap-1 text-xs font-bold border border-blue-100">
                        {option.avatar && (
                            <div className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center text-[8px] overflow-hidden">
                                {option.avatar}
                            </div>
                        )}
                        <span>{option.label}</span>
                        <X
                            className="w-3 h-3 hover:text-blue-900 cursor-pointer"
                            onClick={(e) => removeValue(e, option.value)}
                        />
                    </div>
                ))}

                <div className="ml-auto pointer-events-none text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-200">
                    {options.length === 0 ? (
                        <div className="p-3 text-center text-gray-400 text-xs italic">No options available</div>
                    ) : (
                        options.map(option => {
                            const isSelected = selectedValues.includes(option.value);
                            return (
                                <div
                                    key={option.value}
                                    className={`px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between text-sm transition-colors ${isSelected ? 'bg-blue-50/50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                    onClick={() => toggleOption(option.value)}
                                >
                                    <div className="flex items-center gap-2">
                                        {option.avatar && (
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                {option.avatar}
                                            </div>
                                        )}
                                        {option.label}
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

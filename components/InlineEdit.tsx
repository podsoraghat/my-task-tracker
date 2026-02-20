'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

interface InlineEditProps {
    value: string | number;
    type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
    options?: { label: string; value: string | number }[];
    onSave: (newValue: string | number) => Promise<void>;
    label?: string; // For placeholder/accessibility
    className?: string; // For the container
    inputClassName?: string; // For the input element
    displayValue?: string; // If the display text is different from value (e.g. user name vs user id)
}

export const InlineEdit: React.FC<InlineEditProps> = ({
    value,
    type = 'text',
    options = [],
    onSave,
    label,
    className = '',
    inputClassName = '',
    displayValue
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (currentValue === value) {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        try {
            await onSave(currentValue);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save:', error);
            // Optionally handle error state here
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setCurrentValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && type !== 'textarea') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (type === 'select') {
        const display = options.find(o => o.value == currentValue)?.label || displayValue || 'Select...';

        return (
            <div className={`relative group ${className}`}>
                {/* Visual Fake Label */}
                <div className={`pointer-events-none relative flex items-center justify-between ${inputClassName}`}>
                    <span className="truncate mr-2">{display}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 opacity-50 flex-shrink-0" />
                </div>

                {/* Actual Interactive Select (Invisible but Clickable) */}
                <select
                    value={currentValue}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        setCurrentValue(newValue);
                        onSave(newValue);
                    }}
                    disabled={loading}
                    className={`w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10 ${inputClassName}`}
                    title={label || 'Select option'}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                {loading && (
                    <div className="absolute right-[-24px] top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                )}
            </div>
        );
    }

    if (isEditing) {
        const isError = type === 'number' && typeof currentValue === 'number' && currentValue < 0;

        return (
            <div className={`relative ${className}`}>
                <div className="flex items-center gap-2">
                    {type === 'textarea' ? (
                        <textarea
                            ref={inputRef as any}
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            className={`w-full px-2 py-1 bg-white border rounded-lg text-sm outline-none focus:ring-2 resize-none ${inputClassName} ${isError ? 'border-red-500 focus:ring-red-100' : 'border-blue-500 focus:ring-blue-200'
                                }`}
                            rows={3}
                        />
                    ) : (
                        <input
                            ref={inputRef as any}
                            type={type}
                            min={type === 'number' ? "0" : undefined}
                            value={currentValue}
                            onChange={(e) => setCurrentValue(
                                type === 'number' ? parseFloat(e.target.value) : e.target.value
                            )}
                            onBlur={(e) => {
                                // Block save if error
                                if (type === 'number' && parseFloat(e.target.value) < 0) return;
                                handleSave();
                            }}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            className={`w-full px-2 py-1 bg-white border rounded-lg text-sm outline-none focus:ring-2 ${inputClassName} ${isError ? 'border-red-500 focus:ring-red-100' : 'border-blue-500 focus:ring-blue-200'
                                }`}
                        />
                    )}
                </div>
                {isError && (
                    <p className="absolute top-full left-0 mt-1 text-[10px] font-bold text-red-500 z-10 bg-white px-1 py-0.5 rounded shadow-sm border border-red-100">
                        Time cannot be negative
                    </p>
                )}

                {loading && (
                    <div className="absolute right-[-24px] top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            onClick={() => !loading && setIsEditing(true)}
            className={`group relative cursor-pointer hover:bg-gray-50 rounded-lg -ml-2 px-2 py-1 transition-colors border border-transparent hover:border-gray-200 ${className}`}
            title={`Click to edit ${label || 'value'}`}
        >
            <div className="flex items-center justify-between">
                <span className={`truncate ${inputClassName}`}>
                    {displayValue || currentValue || <span className="text-gray-400 italic">Empty</span>}
                </span>
                <span className="opacity-0 group-hover:opacity-100 text-gray-400 text-[10px] ml-2 uppercase font-bold tracking-wider">
                    Edit
                </span>
            </div>
        </div>
    );
};

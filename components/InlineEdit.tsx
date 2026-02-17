'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

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

    if (isEditing) {
        return (
            <div className={`relative flex items-center gap-2 ${className}`}>
                {type === 'select' ? (
                    <select
                        ref={inputRef as any}
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        onBlur={handleSave}
                        disabled={loading}
                        className={`w-full px-2 py-1 bg-white border border-blue-500 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-200 ${inputClassName}`}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : type === 'textarea' ? (
                    <textarea
                        ref={inputRef as any}
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        className={`w-full px-2 py-1 bg-white border border-blue-500 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none ${inputClassName}`}
                        rows={3}
                    />
                ) : (
                    <input
                        ref={inputRef as any}
                        type={type}
                        value={currentValue}
                        onChange={(e) => setCurrentValue(
                            type === 'number' ? parseFloat(e.target.value) : e.target.value
                        )}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        className={`w-full px-2 py-1 bg-white border border-blue-500 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-200 ${inputClassName}`}
                    />
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

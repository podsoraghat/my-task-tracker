'use client';

import React, { useState, useEffect } from 'react';
import { Play, Square, Loader2 } from 'lucide-react';

interface TaskTimerProps {
    totalSeconds: number;
    timerStart: string | null;
    onStart: () => void;
    onStopWithConfirm: (calculatedSeconds: number) => void;
    readonly?: boolean;
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ totalSeconds, timerStart, onStart, onStopWithConfirm, readonly }) => {
    const [seconds, setSeconds] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let interval: any;
        if (timerStart) {
            const update = () => {
                const start = new Date(timerStart).getTime();
                const now = new Date().getTime();
                const elapsedSinceStart = Math.floor((now - start) / 1000);
                setSeconds((totalSeconds || 0) + elapsedSinceStart);
            };
            update();
            interval = setInterval(update, 1000);
        } else {
            setSeconds(totalSeconds || 0);
        }
        return () => clearInterval(interval);
    }, [timerStart, totalSeconds]);

    const format = (sec: number) => {
        const hrs = Math.floor(sec / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        const secs = sec % 60;
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAction = (action: 'start' | 'stop') => {
        setLoading(true);
        if (action === 'start') {
            onStart();
        } else {
            // Calculate elapsed time and trigger confirmation modal
            const startTime = new Date(timerStart!).getTime();
            const endTime = new Date().getTime();
            const elapsedSeconds = Math.floor((endTime - startTime) / 1000);
            onStopWithConfirm(elapsedSeconds);
        }
        setLoading(false);
    };

    const isActive = !!timerStart;

    return (
        <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded font-mono text-[10px] font-black ${isActive ? 'bg-orange-50 text-orange-600 animate-pulse border border-orange-100' : 'bg-gray-50 text-gray-500'
                }`}>
                {format(seconds)}
            </div>

            {!readonly && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAction(isActive ? 'stop' : 'start');
                    }}
                    disabled={loading}
                    className={`p-1.5 rounded-lg transition-all ${isActive
                        ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                        }`}
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                        isActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>
            )}
        </div>
    );
};

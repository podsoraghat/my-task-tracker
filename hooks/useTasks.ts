'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, isWithinInterval, parseISO } from 'date-fns';

export interface Task {
    id: string;
    client_name: string;
    asset_type: string;
    task_name: string;
    start_date: string;
    status: string;
    time_taken: string;
    user_name: string;
    user_id: string;
    asset_count: number;
    created_at: string;
}

export type TimePreset = 'today' | 'week' | 'month' | 'custom' | 'all';

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        user: '',
        client: '',
        type: '',
        status: '',
        search: '',
        startDate: '',
        endDate: '',
        preset: 'all' as TimePreset
    });

    const [referenceDate, setReferenceDate] = useState(new Date());

    const [sort, setSort] = useState({
        column: 'start_date',
        direction: 'desc' as 'asc' | 'desc'
    });

    const loadTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const navigateTime = (direction: 'prev' | 'next') => {
        const amount = direction === 'next' ? 1 : -1;
        if (filters.preset === 'today') setReferenceDate(prev => addDays(prev, amount));
        if (filters.preset === 'week') setReferenceDate(prev => addWeeks(prev, amount));
        if (filters.preset === 'month') setReferenceDate(prev => addMonths(prev, amount));
    };

    const activeRange = useMemo(() => {
        if (filters.preset === 'today') return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) };
        if (filters.preset === 'week') return { start: startOfWeek(referenceDate), end: endOfWeek(referenceDate) };
        if (filters.preset === 'month') return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
        if (filters.preset === 'custom' && filters.startDate && filters.endDate) {
            return { start: startOfDay(parseISO(filters.startDate)), end: endOfDay(parseISO(filters.endDate)) };
        }
        return null;
    }, [filters.preset, filters.startDate, filters.endDate, referenceDate]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesUser = !filters.user || task.user_name === filters.user;
            const matchesClient = !filters.client || task.client_name === filters.client;
            const matchesType = !filters.type || task.asset_type === filters.type;
            const matchesStatus = !filters.status || task.status === filters.status;
            const matchesSearch = !filters.search ||
                task.task_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                task.client_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                task.user_name.toLowerCase().includes(filters.search.toLowerCase());

            let matchesDate = true;
            if (activeRange) {
                const taskDate = parseISO(task.start_date);
                matchesDate = isWithinInterval(taskDate, activeRange);
            }

            return matchesUser && matchesClient && matchesType && matchesStatus && matchesSearch && matchesDate;
        });
    }, [tasks, filters, activeRange]);

    const sortedTasks = useMemo(() => {
        const sorted = [...filteredTasks];
        if (sort.column) {
            sorted.sort((a: any, b: any) => {
                const valA = a[sort.column] || '';
                const valB = b[sort.column] || '';

                if (sort.direction === 'asc') {
                    return valA > valB ? 1 : -1;
                } else {
                    return valA < valB ? 1 : -1;
                }
            });
        }
        return sorted;
    }, [filteredTasks, sort]);

    const resetFilters = () => {
        setFilters({
            user: '',
            client: '',
            type: '',
            status: '',
            search: '',
            startDate: '',
            endDate: '',
            preset: 'all'
        });
        setReferenceDate(new Date());
    };

    return {
        tasks: sortedTasks,
        allTasks: tasks,
        loading,
        error,
        filters,
        setFilters,
        sort,
        setSort,
        refresh: loadTasks,
        navigateTime,
        activeRange,
        referenceDate,
        resetFilters
    };
};

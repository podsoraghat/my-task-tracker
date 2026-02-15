'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

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
    created_at: string;
}

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        client: '',
        type: '',
        status: '',
        search: ''
    });

    const [sort, setSort] = useState({
        column: 'created_at',
        direction: 'desc' as 'asc' | 'desc'
    });

    const loadTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

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

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesClient = !filters.client || task.client_name === filters.client;
            const matchesType = !filters.type || task.asset_type === filters.type;
            const matchesStatus = !filters.status || task.status === filters.status;
            const matchesSearch = !filters.search ||
                task.task_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                task.client_name.toLowerCase().includes(filters.search.toLowerCase());

            return matchesClient && matchesType && matchesStatus && matchesSearch;
        });
    }, [tasks, filters]);

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

    return {
        tasks: sortedTasks,
        allTasks: tasks,
        loading,
        error,
        filters,
        setFilters,
        sort,
        setSort,
        refresh: loadTasks
    };
};

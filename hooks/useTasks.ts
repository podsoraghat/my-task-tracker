'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, isWithinInterval, parseISO } from 'date-fns';

export interface Project {
    id: string;
    name: string;
    client_name: string;
    start_date: string;
    deadline: string;
    status: string;
    created_at: string;
}

export interface ProjectMember {
    project_id: string;
    user_id: string;
    user_name: string | null;
}

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
    assigned_to: string | null;
    assigned_to_name: string | null;
    asset_count: number;
    created_at: string;
    project_id: string | null;
    total_seconds: number;
    timer_start: string | null;
    assignees: { user_id: string; user_name: string; avatar_url?: string }[];
}

export type TimePreset = 'today' | 'week' | 'month' | 'custom' | 'all';

export interface ActiveTimer {
    taskId: string;
    startTime: string; // ISO string
    logId: string;
}

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
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
        preset: 'all' as TimePreset,
        projectId: '' as string,
        showOnlyMine: true // Default to "My Tasks"
    });

    const [referenceDate, setReferenceDate] = useState(new Date());

    const [sort, setSort] = useState({
        column: 'start_date',
        direction: 'desc' as 'asc' | 'desc'
    });

    const [activeTimerMap, setActiveTimerMap] = useState<Record<string, ActiveTimer | null>>({});

    const loadData = async () => {
        setLoading(true);
        try {
            // Get current user for active timers
            const { data: { user } } = await supabase.auth.getUser();

            const [tasksRes, projectsRes, membersRes, assignmentsRes, profilesRes, activeTimersRes] = await Promise.all([
                supabase.from('tasks').select('*').order('start_date', { ascending: false }),
                supabase.from('projects').select('*').order('created_at', { ascending: false }),
                supabase.from('project_members').select('*'),
                supabase.from('task_assignments').select('*'),
                supabase.from('profiles').select('id, full_name, avatar_url'),
                user ? supabase.from('time_logs')
                    .select('id, task_id, session_start')
                    .eq('user_id', user.id)
                    .is('session_end', null) : Promise.resolve({ data: [], error: null })
            ]);

            if (tasksRes.error) throw tasksRes.error;
            if (projectsRes.error) throw projectsRes.error;
            if (membersRes.error) throw membersRes.error;

            // Map assignments to tasks
            const tasksWithAssignees = (tasksRes.data || []).map((task: any) => {
                const taskAssignments = (assignmentsRes.data || []).filter((a: any) => a.task_id === task.id);
                const assignees = taskAssignments.map((a: any) => {
                    const profile = (profilesRes.data || []).find((p: any) => p.id === a.user_id);
                    return {
                        user_id: a.user_id,
                        user_name: profile?.full_name || 'Unknown',
                        avatar_url: profile?.avatar_url
                    };
                });
                return { ...task, assignees };
            });

            setTasks(tasksWithAssignees);
            setProjects(projectsRes.data || []);
            setProjectMembers(membersRes.data || []);

            // Process active timers
            const timerMap: Record<string, ActiveTimer | null> = {};
            (activeTimersRes.data || []).forEach((log: any) => {
                timerMap[log.task_id] = {
                    taskId: log.task_id,
                    startTime: log.session_start,
                    logId: log.id
                };
            });
            setActiveTimerMap(timerMap);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Real-time subscription
        const channel = supabase
            .channel('tasks_channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // For simplicity, reload to get joined data (client/project/assignees)
                        loadData();
                    } else if (payload.eventType === 'UPDATE') {
                        loadData();
                    } else if (payload.eventType === 'DELETE') {
                        setTasks(current => current.filter(t => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
            // "My Tasks" Logic: Show only if current user is the creator OR assignee
            // (Assigned To Me = assigned_to matches current UUID)
            // But since useTasks doesn't know 'auth.user', we'll handle the actual ID filtering 
            // in the component or pass it in. For now, we'll keep the logic ready.

            const matchesProject = !filters.projectId || task.project_id === filters.projectId;

            const matchesUser = !filters.user ||
                task.user_name === filters.user ||
                task.assigned_to_name === filters.user ||
                task.assignees.some(a => a.user_name === filters.user);

            const matchesClient = !filters.client || task.client_name === filters.client;
            const matchesType = !filters.type || task.asset_type === filters.type;
            const matchesStatus = !filters.status || task.status === filters.status;
            const matchesSearch = !filters.search ||
                task.task_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                task.client_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                task.user_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                (task.assigned_to_name || "").toLowerCase().includes(filters.search.toLowerCase()) ||
                task.assignees.some(a => a.user_name.toLowerCase().includes(filters.search.toLowerCase()));

            let matchesDate = true;
            if (activeRange) {
                if (!task.start_date) {
                    matchesDate = false;
                } else {
                    try {
                        const taskDate = parseISO(task.start_date);
                        if (isNaN(taskDate.getTime())) {
                            matchesDate = false;
                        } else {
                            matchesDate = isWithinInterval(taskDate, activeRange);
                        }
                    } catch (e) {
                        matchesDate = false;
                    }
                }
            }

            return matchesProject && matchesUser && matchesClient && matchesType && matchesStatus && matchesSearch && matchesDate;
        });
    }, [tasks, filters, activeRange]);

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch = !filters.search ||
                project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                project.client_name.toLowerCase().includes(filters.search.toLowerCase());

            const matchesStatus = !filters.status || project.status === filters.status;

            return matchesSearch && matchesStatus;
        });
    }, [projects, filters]);

    const sortedTasks = useMemo(() => {
        const sorted = [...filteredTasks];
        if (sort.column) {
            sorted.sort((a: any, b: any) => {
                let valA = a[sort.column];
                let valB = b[sort.column];

                // Logic hardening: Handle time_taken parsing (e.g., "1hr 30min")
                if (sort.column === 'time_taken') {
                    const getSeconds = (item: any) => {
                        if (typeof item.total_seconds === 'number') return item.total_seconds;

                        const str = item.time_taken;
                        if (!str) return 0;
                        const hrs = parseInt(str.match(/(\d+)hr/)?.[1] || '0');
                        const mins = parseInt(str.match(/(\d+)min/)?.[1] || '0');
                        return (hrs * 3600) + (mins * 60);
                    };
                    valA = getSeconds(a);
                    valB = getSeconds(b);
                }

                // Logic hardening: Handle nulls/undefined for all types
                if (valA === null || valA === undefined) valA = sort.column === 'asset_count' ? 1 : '';
                if (valB === null || valB === undefined) valB = sort.column === 'asset_count' ? 1 : '';

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
            preset: 'all',
            projectId: '',
            showOnlyMine: true
        });
        setReferenceDate(new Date());
    };

    const startTimer = async (taskId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date().toISOString();

        // 1. Create a new active session in time_logs
        const { error } = await supabase
            .from('time_logs')
            .insert({
                task_id: taskId,
                user_id: user.id,
                user_name: user.email?.split('@')[0] || 'Unknown',
                seconds_logged: 0, // Placeholder
                session_start: now,
                session_end: null
            });

        // 2. Update task status to In Progress if needed (optional, but good for visibility)
        await supabase
            .from('tasks')
            .update({ status: 'In Progress' })
            .eq('id', taskId);

        if (!error) loadData();
        else setError(error.message);
    };

    const stopTimer = async (taskId: string) => {
        // This is now purely a helper to get the start time for the UI logic
        // The actual DB update happens in page.tsx via confirmTimerStop -> stop_timer_session RPC
        // We just reload data here if needed, but mostly we rely on the modal flow.
        return activeTimerMap[taskId]?.startTime;
    };

    const formatSeconds = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}hr ${m}min`;
    };

    return {
        tasks: sortedTasks,
        allTasks: tasks,
        projects: filteredProjects,
        allProjects: projects,
        projectMembers,
        loading,
        error,
        filters,
        setFilters,
        sort,
        setSort,
        refresh: loadData,
        navigateTime,
        activeRange,
        referenceDate,
        resetFilters,
        activeTimerMap,
        startTimer,
        stopTimer
    };
};

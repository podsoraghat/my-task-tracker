'use client';

import { useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { AuthOverlay } from "@/components/AuthOverlay";
import { Navbar } from "@/components/Navbar";
import { TaskTable } from "@/components/TaskTable";
import { TaskModal } from "@/components/TaskModal";
import { ManagerModal } from "@/components/ManagerModal";
import { useTasks, Task } from "@/hooks/useTasks";
import { Loader2, Plus, Users, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const {
    tasks,
    loading: tasksLoading,
    filters,
    setFilters,
    sort,
    setSort,
    refresh,
    navigateTime,
    activeRange,
    referenceDate,
    resetFilters
  } = useTasks();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [managerConfig, setManagerConfig] = useState<{ title: string; table: 'clients' | 'assets'; isOpen: boolean }>({
    title: '',
    table: 'clients',
    isOpen: false
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthOverlay />;
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) refresh();
    else alert(error.message);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const openNewTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />

      <main className="flex-1 p-6 scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Dashboard</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Manage your daily tasks and workflow</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setManagerConfig({ title: 'Client', table: 'clients', isOpen: true })}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-100 transition-all border border-gray-100"
              >
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">Clients</span>
              </button>

              <button
                onClick={() => setManagerConfig({ title: 'Asset', table: 'assets', isOpen: true })}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-100 transition-all border border-gray-100"
              >
                <Tag className="w-4 h-4" />
                <span className="hidden md:inline">Assets</span>
              </button>

              <button
                onClick={openNewTaskModal}
                className="flex-[2] sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </div>
          </div>

          {/* Table */}
          <TaskTable
            tasks={tasks}
            loading={tasksLoading}
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            onEdit={openEditModal}
            onDelete={handleDeleteTask}
            navigateTime={navigateTime}
            activeRange={activeRange}
            referenceDate={referenceDate}
            onReset={resetFilters}
          />
        </div>
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={refresh}
        editTask={editingTask}
      />

      <ManagerModal
        title={managerConfig.title}
        table={managerConfig.table}
        isOpen={managerConfig.isOpen}
        onClose={() => setManagerConfig({ ...managerConfig, isOpen: false })}
        onUpdate={refresh}
      />

      <footer className="py-8 text-center border-t border-gray-100 bg-white">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Task Tracker v2.0 • Powered by Supabase & Next.js</p>
      </footer>
    </div>
  );
}

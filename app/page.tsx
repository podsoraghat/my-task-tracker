'use client';

import { useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { AuthOverlay } from "@/components/AuthOverlay";
import { Navbar } from "@/components/Navbar";
import { TaskTable } from "@/components/TaskTable";
import { TaskModal } from "@/components/TaskModal";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectModal } from "@/components/ProjectModal";
import { ManagerModal } from "@/components/ManagerModal";
import { useTasks, Task, Project } from "@/hooks/useTasks";
import { Loader2, Plus, Users, Tag, LayoutGrid } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TimeConfirmModal } from "@/components/TimeConfirmModal";
import { TaskDetailView } from "@/components/TaskDetailView";
import { ProjectDetailView } from "@/components/ProjectDetailView";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const {
    tasks,
    projects,
    projectMembers,
    loading: tasksLoading,
    filters,
    setFilters,
    sort,
    setSort,
    refresh,
    navigateTime,
    activeRange,
    referenceDate,
    resetFilters,
    activeTimerMap,
    startTimer,
    stopTimer
  } = useTasks();

  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [managerConfig, setManagerConfig] = useState<{ title: string; table: 'clients' | 'assets'; isOpen: boolean }>({
    title: '',
    table: 'clients',
    isOpen: false
  });

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  // Timer confirmation modal state
  const [timeConfirmModal, setTimeConfirmModal] = useState<{
    isOpen: boolean;
    taskId: string;
    calculatedSeconds: number;
    existingSeconds: number;
  }>({ isOpen: false, taskId: '', calculatedSeconds: 0, existingSeconds: 0 });

  // Task detail view state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null;
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  // Project detail view state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) || null : null;
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);

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
    if (!error) {
      if (selectedTaskId === id) {
        setIsDetailViewOpen(false);
        setSelectedTaskId(null);
      }
      refresh();
    }
    else alert(error.message);
  };


  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? Tasks linked to this project will become "General Tasks".')) return;

    // 1. Unlink tasks first (Safety)
    await supabase.from('tasks').update({ project_id: null }).eq('project_id', id);

    // 2. Delete the project
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) refresh();
    else alert(error.message);
  };


  const openNewTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const openNewProjectModal = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleStopTimerWithConfirm = (taskId: string, calculatedSeconds: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Calculate elapsed time from the active timer map, NOT the task.timer_start
    // calculatedSeconds passed from TaskTable is likely based on the local timer tick, which is good.
    // existingSeconds is the baseline.

    setTimeConfirmModal({
      isOpen: true,
      taskId,
      calculatedSeconds,
      existingSeconds: task.total_seconds || 0
    });
  };

  const confirmTimerStop = async (adjustedSeconds: number) => {
    const newTotalSeconds = timeConfirmModal.existingSeconds + adjustedSeconds;
    const task = tasks.find(t => t.id === timeConfirmModal.taskId);
    if (!task) return;

    const formatSeconds = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}hr ${m}min`;
    };

    // Calculate session times
    const sessionEnd = new Date().toISOString();

    // We need the legacy format for the UI/Search, but the RPC handles the math safely
    const estimatedTotal = (task.total_seconds || 0) + adjustedSeconds;
    const timeTakenStr = formatSeconds(estimatedTotal);

    // Call RPC to atomically update logs and task total
    const { error: rpcError } = await supabase.rpc('stop_timer_session', {
      p_task_id: timeConfirmModal.taskId,
      p_user_id: user.id,
      p_seconds_logged: adjustedSeconds,
      p_session_end: sessionEnd,
      p_time_taken_str: timeTakenStr
    });

    if (!rpcError) {
      refresh();
      setTimeConfirmModal({ isOpen: false, taskId: '', calculatedSeconds: 0, existingSeconds: 0 });
    } else {
      alert(rpcError.message);
    }
  };

  const handleDiscardTimer = async () => {
    // Just delete the open log entry
    if (!user) return;

    const { error } = await supabase
      .from('time_logs')
      .delete()
      .eq('task_id', timeConfirmModal.taskId)
      .eq('user_id', user.id)
      .is('session_end', null);

    if (!error) {
      refresh();
      setTimeConfirmModal({ isOpen: false, taskId: '', calculatedSeconds: 0, existingSeconds: 0 });
    } else {
      alert(error.message);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsDetailViewOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />

      <main className="flex-1 p-6 scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Navigation & Action Bar */}
          <div className="sticky top-16 z-30 bg-gray-50/80 backdrop-blur-md py-2 -mx-2 px-2">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">

              {/* Tab Switcher */}
              <div className="flex p-1 bg-gray-100 rounded-lg w-full lg:w-auto">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'tasks'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'projects'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Projects
                </button>
              </div>

              {/* View Toggle & Actions */}
              <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                {/* Personal/Team Toggle */}
                <div className="flex p-1 bg-gray-50 rounded-lg border border-gray-100 mr-2">
                  <button
                    onClick={() => setFilters({ ...filters, showOnlyMine: true })}
                    className={`px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-black transition-all ${filters.showOnlyMine ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
                      }`}
                  >
                    My {activeTab === 'tasks' ? 'Tasks' : 'Projects'}
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, showOnlyMine: false })}
                    className={`px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-black transition-all ${!filters.showOnlyMine ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
                      }`}
                  >
                    Team
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setManagerConfig({ title: 'Client', table: 'clients', isOpen: true })}
                    className="flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-100 transition-all border border-gray-100"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden md:inline">Clients</span>
                  </button>

                  <button
                    onClick={() => setManagerConfig({ title: 'Asset', table: 'assets', isOpen: true })}
                    className="flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-100 transition-all border border-gray-100"
                  >
                    <Tag className="w-4 h-4" />
                    <span className="hidden md:inline">Assets</span>
                  </button>

                  <button
                    onClick={activeTab === 'tasks' ? openNewTaskModal : () => setIsProjectModalOpen(true)}
                    className="flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    {activeTab === 'tasks' ? 'Assign Task' : 'New Project'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Content */}
          {activeTab === 'tasks' ? (
            <TaskTable
              tasks={filters.showOnlyMine ? tasks.filter(t => t.assigned_to === user.id || t.assignees.some(a => a.user_id === user.id)) : tasks}
              loading={tasksLoading}
              filters={filters}
              setFilters={setFilters}
              sort={sort}
              setSort={setSort}
              onDelete={handleDeleteTask}
              navigateTime={navigateTime}
              activeRange={activeRange}
              referenceDate={referenceDate}
              onReset={resetFilters}
              onStartTimer={startTimer}
              onStopTimer={handleStopTimerWithConfirm}
              onTaskClick={handleTaskClick}
              activeTimerMap={activeTimerMap}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {(filters.showOnlyMine
                ? projects.filter(p => projectMembers.some(m => m.project_id === p.id && m.user_id === user.id))
                : projects
              ).map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  tasks={tasks}
                  members={projectMembers.filter(m => m.project_id === project.id)}
                  onDelete={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setIsProjectDetailOpen(true);
                  }}
                />
              ))}

              {/* Add Project Card */}
              <div
                onClick={openNewProjectModal}
                className="group bg-white/50 rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-300 hover:bg-white hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-400 group-hover:text-blue-600 uppercase tracking-widest">New Project</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Scale your vision</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={refresh}
        editTask={editingTask}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={refresh}
        editProject={editingProject}
      />

      <ManagerModal
        title={managerConfig.title}
        table={managerConfig.table}
        isOpen={managerConfig.isOpen}
        onClose={() => setManagerConfig({ ...managerConfig, isOpen: false })}
        onUpdate={refresh}
      />

      <TimeConfirmModal
        isOpen={timeConfirmModal.isOpen}
        calculatedSeconds={timeConfirmModal.calculatedSeconds}
        onConfirm={confirmTimerStop}
        onDiscard={handleDiscardTimer}
        onCancel={() => setTimeConfirmModal({ isOpen: false, taskId: '', calculatedSeconds: 0, existingSeconds: 0 })}
      />

      <TaskDetailView
        task={selectedTask}
        isOpen={isDetailViewOpen}
        onClose={() => setIsDetailViewOpen(false)}
        onDelete={() => {
          if (selectedTask) {
            handleDeleteTask(selectedTask.id);
          }
        }}
        onUpdate={refresh}
      />

      <ProjectDetailView
        project={selectedProject}
        tasks={tasks}
        members={projectMembers}
        isOpen={isProjectDetailOpen}
        onClose={() => setIsProjectDetailOpen(false)}
        activeTimerMap={activeTimerMap}
        onStartTimer={startTimer}
        onStopTimer={handleStopTimerWithConfirm}
        onTaskClick={(taskId) => {
          setIsProjectDetailOpen(false); // Close project view first
          const task = tasks.find(t => t.id === taskId);
          if (task) handleTaskClick(task);
        }}
      />

      <footer className="py-8 text-center border-t border-gray-100 bg-white">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Zive Dashboard v2.5 • Projects & Tasks Sync</p>
      </footer>
    </div>
  );
}

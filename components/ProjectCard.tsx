'use client';

import { Project, Task, ProjectMember } from '@/hooks/useTasks';
import { Calendar, Users, CheckCircle2, Clock, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ProjectCardProps {
    project: Project;
    tasks: Task[];
    members: ProjectMember[];
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
}

export const ProjectCard = ({ project, tasks, members, onClick, onDelete }: ProjectCardProps) => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer flex flex-col space-y-4"
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {project.client_name}
                    </span>
                    <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                        {project.name}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${project.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                        }`}>
                        {project.status}
                    </div>
                </div>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(parseISO(project.start_date), 'MMM d')} - {format(parseISO(project.deadline), 'MMM d, yyyy')}</span>
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Current Progress</span>
                    <span className="text-sm font-black text-blue-600">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Stats, Members & Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 mr-2">
                        {members.slice(0, 3).map((member, i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm"
                                title={member.user_name || 'Member'}
                            >
                                {(member.user_name || 'U')[0].toUpperCase()}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-black text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {completedTasks}/{totalTasks}
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onDelete}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Project"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

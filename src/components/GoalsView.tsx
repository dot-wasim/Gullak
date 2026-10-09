import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Goal } from '../types';
import { getGoalDurationInfo } from '../lib/storage';
import {
  Target,
  Plus,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Trash2,
  Sparkles,
  Clock,
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface GoalsViewProps {
  onOpenAddGoal: () => void;
  onOpenDeposit: (goalId: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  onOpenAddGoal,
  onOpenDeposit,
}) => {
  const { goals, settings, deleteGoal } = useApp();
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const inProgressGoals = useMemo(() => goals.filter((g) => g.saved < g.target), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.saved >= g.target), [goals]);

  const filteredGoals = useMemo(() => {
    if (filter === 'active') return inProgressGoals;
    if (filter === 'completed') return completedGoals;
    return goals;
  }, [goals, filter, inProgressGoals, completedGoals]);

  const handleDeleteConfirm = async () => {
    if (goalToDelete) {
      await deleteGoal(goalToDelete.id);
      setGoalToDelete(null);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Savings Goals</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and save towards your targets</p>
        </div>
        <button
          type="button"
          onClick={onOpenAddGoal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Filter Tabs */}
      {goals.length > 0 && (
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({goals.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              filter === 'active'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            In Progress ({inProgressGoals.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              filter === 'completed'
                ? 'bg-emerald-800 text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Completed ({completedGoals.length})
          </button>
        </div>
      )}

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {goals.length === 0
              ? 'No savings goals yet'
              : filter === 'completed'
              ? 'No completed goals yet'
              : 'No in-progress goals'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {goals.length === 0
              ? 'Create a goal like an emergency fund, holiday trip, or new gadget.'
              : filter === 'completed'
              ? 'Keep saving towards your active targets to see them listed here!'
              : 'All your goals are completed! Create a new one below.'}
          </p>
          <button
            type="button"
            onClick={onOpenAddGoal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Goal</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredGoals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
            const isCompleted = goal.saved >= goal.target;
            const remaining = Math.max(0, goal.target - goal.saved);
            const durationInfo = getGoalDurationInfo(goal);

            return (
              <div
                key={goal.id}
                className={`bg-white border rounded-2xl p-5 shadow-2xs transition space-y-4 ${
                  isCompleted
                    ? 'border-emerald-300/80 bg-linear-to-b from-white to-emerald-50/20'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-800">{goal.name}</h3>
                      {isCompleted ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>{durationInfo.durationText}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{durationInfo.durationText}</span>
                        </span>
                      )}
                    </div>

                    {goal.deadline && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Target date: {new Date(goal.deadline).toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setGoalToDelete(goal)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* FR-13: Progress Bar & Percentage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800 text-sm">
                      {settings.currency}{goal.saved.toLocaleString()}
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        of {settings.currency}{goal.target.toLocaleString()}
                      </span>
                    </span>
                    <span className="font-black text-emerald-600 text-sm">{percent}%</span>
                  </div>

                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* FR-14: Complete message vs Add Money CTA (FR-12) */}
                {isCompleted ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Goal Reached: {settings.currency}{goal.target.toLocaleString()}!</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 pl-6 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Time taken to complete: <b>{durationInfo.durationText}</b></span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Need {settings.currency}{remaining.toLocaleString()} more
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenDeposit(goal.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Money</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Goal Confirmation */}
      <DeleteConfirmModal
        isOpen={Boolean(goalToDelete)}
        title="Delete Savings Goal"
        message={`Delete goal "${goalToDelete?.name}"? Saved money records for this goal will be removed.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setGoalToDelete(null)}
      />
    </div>
  );
};

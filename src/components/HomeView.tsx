import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getGoalDurationInfo } from '../lib/storage';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Plus,
  CloudCheck,
  CloudOff,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Calendar,
} from 'lucide-react';

interface HomeViewProps {
  onOpenAddEntry: () => void;
  onNavigateToGoals: () => void;
  onNavigateToHistory: () => void;
  onOpenDeposit: (goalId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenAddEntry,
  onNavigateToGoals,
  onNavigateToHistory,
  onOpenDeposit,
}) => {
  const {
    monthSummary,
    goals,
    entries,
    settings,
    backupMeta,
    selectedMonthKey,
    setSelectedMonthKey,
    allMonthsSummaries,
    goToPreviousMonth,
    goToNextMonth,
  } = useApp();

  const [showAllMonths, setShowAllMonths] = useState(false);

  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const isCurrentMonth = selectedMonthKey === currentMonthKey;

  const activeGoals = goals.slice(0, 3);
  const recentEntries = entries.slice(0, 4);

  // Month-wise tracker entries to display (recent 4 or all)
  const displayedMonths = showAllMonths
    ? allMonthsSummaries
    : allMonthsSummaries.slice(0, 4);

  return (
    <div className="space-y-6 pb-24">
      {/* Month Header & Backup status (BR-09, Risk mitigation) */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
              {monthSummary.label}
            </span>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonthKey(currentMonthKey)}
                className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full transition cursor-pointer"
              >
                Reset to Current
              </button>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Overview</h1>
        </div>
        <div className="text-right">
          {backupMeta?.lastBackupAt ? (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
              <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Backup: {new Date(backupMeta.lastBackupAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <CloudOff className="w-3.5 h-3.5" />
              <span>Not backed up yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Financial Card with Interactive Month Switcher (FR-15, FR-16, FR-17) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Month Selector Bar */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Net Balance</span>
          </span>

          {/* Month Navigation Controls */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-1.5 py-1">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded-lg transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold text-slate-200 px-1.5 select-none">
              {monthSummary.shortLabel}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded-lg transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* FR-17: Net Balance */}
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
          <span className={monthSummary.balance >= 0 ? 'text-white' : 'text-rose-300'}>
            {settings.currency}{monthSummary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* FR-15: Income & FR-16: Expenses */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/70">
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Earned</span>
            </div>
            <div className="text-base font-bold text-slate-100">
              {settings.currency}{monthSummary.income.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold mb-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Spent</span>
            </div>
            <div className="text-base font-bold text-slate-100">
              {settings.currency}{monthSummary.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating / Prominent Action Button (FR-19, Rule 5: Add entry in <10s) */}
      <button
        type="button"
        onClick={onOpenAddEntry}
        className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-[0.99]"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span className="text-base">Add Entry</span>
      </button>

      {/* Active Goals Preview (FR-18, FR-13, FR-14) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>Savings Goals</span>
          </h2>
          <button
            type="button"
            onClick={onNavigateToGoals}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeGoals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 space-y-2">
            <p className="text-xs">No active goals yet. Set a savings goal to keep track.</p>
            <button
              type="button"
              onClick={onNavigateToGoals}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              + Create your first goal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal) => {
              const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
              const isCompleted = goal.saved >= goal.target;

              return (
                <div
                  key={goal.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{goal.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {goal.deadline && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Target: {new Date(goal.deadline).toLocaleDateString()}</span>
                          </span>
                        )}
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{getGoalDurationInfo(goal).durationText}</span>
                        </span>
                      </div>
                    </div>

                    {isCompleted ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Completed!</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenDeposit(goal.id)}
                        className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer"
                      >
                        + Add Money
                      </button>
                    )}
                  </div>

                  {/* FR-13: Progress bar and percentage */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCompleted ? 'bg-emerald-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {settings.currency}{goal.saved.toLocaleString()} / {settings.currency}{goal.target.toLocaleString()}
                      </span>
                      <span className="font-bold text-slate-800">{percent}%</span>
                    </div>
                  </div>

                  {/* FR-14: Completion message */}
                  {isCompleted && (
                    <div className="text-[11px] text-emerald-700 bg-emerald-50/80 border border-emerald-200 rounded-lg p-2 font-medium text-center">
                      Goal complete! You saved {settings.currency}{goal.saved.toLocaleString()} for {goal.name} ({getGoalDurationInfo(goal).durationText}).
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Month-wise Tracker Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span>Month-wise Tracker</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Compare your earnings, spending and savings across months
            </p>
          </div>
          {allMonthsSummaries.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllMonths(!showAllMonths)}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              {showAllMonths ? 'Show Less' : `View All (${allMonthsSummaries.length})`}
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {displayedMonths.map((m) => {
            const isSelected = m.key === selectedMonthKey;
            const savingsRate = m.income > 0 ? Math.round((m.balance / m.income) * 100) : 0;
            const spentPercent = m.income > 0 ? Math.min(100, Math.round((m.expenses / m.income) * 100)) : 0;

            return (
              <div
                key={m.key}
                onClick={() => setSelectedMonthKey(m.key)}
                className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{m.label}</span>
                    {m.key === currentMonthKey && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        m.balance >= 0
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      Net: {settings.currency}{m.balance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Income vs Expense breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs py-1.5 border-t border-slate-100/80">
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-500 text-[11px] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      <span>Earned</span>
                    </span>
                    <span className="font-bold text-emerald-700">
                      +{settings.currency}{m.income.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-500 text-[11px] flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-rose-600" />
                      <span>Spent</span>
                    </span>
                    <span className="font-bold text-rose-700">
                      -{settings.currency}{m.expenses.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Savings Ratio Bar */}
                {m.income > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-rose-400 h-full transition-all"
                        style={{ width: `${spentPercent}%` }}
                        title={`Spent ${spentPercent}%`}
                      />
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${Math.max(0, 100 - spentPercent)}%` }}
                        title={`Saved ${Math.max(0, 100 - spentPercent)}%`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Spent {spentPercent}%</span>
                      <span className={savingsRate >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                        {savingsRate >= 0 ? `Saved ${savingsRate}%` : 'Deficit'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Entries Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Records</h2>
          <button
            type="button"
            onClick={onNavigateToHistory}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <span>All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentEntries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
            <p className="text-xs">No entries recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Tap "Add Entry" above to record your first transaction.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      entry.type === 'income'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {entry.type === 'income' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {entry.type === 'income' ? entry.source : entry.category}
                    </h4>
                    <span className="text-[11px] text-slate-400">{entry.date}</span>
                  </div>
                </div>

                <div
                  className={`text-xs font-extrabold ${
                    entry.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                  }`}
                >
                  {entry.type === 'income' ? '+' : '-'}
                  {settings.currency}
                  {entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security note (NF-05, Design rules) */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Stored privately on device. No login, no telemetry tracking.</span>
      </div>
    </div>
  );
};

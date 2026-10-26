import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Entry, EntryType } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  Search,
  Filter,
  Calendar,
  FileText,
  Building2,
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface HistoryViewProps {
  onEditEntry: (entry: Entry) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onEditEntry }) => {
  const { entries, settings, deleteEntry, allMonthsSummaries, accounts, defaultAccount } = useApp();
  const [filterType, setFilterType] = useState<'all' | EntryType>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [filterAccount, setFilterAccount] = useState<string>('all'); // 'all' or accountId
  const [searchQuery, setSearchQuery] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);

  // Filter and search entries (FR-20: Newest first)
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) {
        return false;
      }
      if (filterMonth !== 'all' && (!e.date || !e.date.startsWith(filterMonth))) {
        return false;
      }
      if (filterAccount !== 'all') {
        const entryAccId = e.accountId || defaultAccount.id;
        if (entryAccId !== filterAccount) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const categoryMatch = e.category?.toLowerCase().includes(query) ?? false;
        const sourceMatch = e.source?.toLowerCase().includes(query) ?? false;
        const noteMatch = e.note?.toLowerCase().includes(query) ?? false;
        const amountMatch = e.amount.toString().includes(query);
        const accountName = (e.accountName || accounts.find((a) => a.id === e.accountId)?.name || '').toLowerCase();
        const accountMatch = accountName.includes(query);
        return categoryMatch || sourceMatch || noteMatch || amountMatch || accountMatch;
      }
      return true;
    });
  }, [entries, filterType, filterMonth, filterAccount, searchQuery, defaultAccount, accounts]);

  // Aggregate totals for the active filtered set
  const filteredSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const item of filteredEntries) {
      if (item.type === 'income') income += item.amount;
      else if (item.type === 'expense') expense += item.amount;
    }
    return { income, expense, balance: income - expense };
  }, [filteredEntries]);

  const handleDeleteConfirm = async () => {
    if (entryToDelete) {
      await deleteEntry(entryToDelete.id);
      setEntryToDelete(null);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">History</h1>
        <p className="text-xs text-slate-500 mt-0.5">Filter records by month, type, and note</p>
      </div>

      {/* Filter Tabs, Month & Account Dropdowns & Search */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search note, category, account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
          />
        </div>

        {/* Month & Account Filters */}
        <div className="flex gap-2">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-emerald-500 cursor-pointer shadow-2xs truncate"
            title="Filter by Month"
          >
            <option value="all">All Months</option>
            {allMonthsSummaries.map((m) => (
              <option key={m.key} value={m.key}>
                {m.shortLabel} ({m.entryCount})
              </option>
            ))}
          </select>

          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-emerald-500 cursor-pointer shadow-2xs truncate"
            title="Filter by Account"
          >
            <option value="all">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} {acc.id === defaultAccount.id ? '⭐' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({filteredEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('expense')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              filterType === 'expense'
                ? 'bg-rose-500 text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setFilterType('income')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              filterType === 'income'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Income
          </button>
        </div>

        {/* Dynamic Filtered Summary Bar */}
        {filteredEntries.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px]">
            <div className="text-slate-500">
              Earned: <span className="font-bold text-emerald-700">+{settings.currency}{filteredSummary.income.toLocaleString()}</span>
            </div>
            <div className="text-slate-500">
              Spent: <span className="font-bold text-rose-700">-{settings.currency}{filteredSummary.expense.toLocaleString()}</span>
            </div>
            <div className="text-slate-500">
              Net: <span className={`font-bold ${filteredSummary.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {settings.currency}{filteredSummary.balance.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Entries List (FR-20) */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-1">
          <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No records found</p>
          <p className="text-xs text-slate-400">
            {searchQuery ? 'Try clearing your search term.' : 'Record your first entry on the Home screen.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      entry.type === 'income'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {entry.type === 'income' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {entry.type === 'income' ? entry.source : entry.category}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{entry.date}</span>
                      </span>
                      <span className="capitalize">{entry.type}</span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                        <Building2 className="w-2.5 h-2.5 text-slate-500" />
                        <span>{entry.accountName || accounts.find((a) => a.id === entry.accountId)?.name || defaultAccount.name}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div
                    className={`text-base font-extrabold ${
                      entry.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {entry.type === 'income' ? '+' : '-'}
                    {settings.currency}
                    {entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Note if present */}
              {entry.note && (
                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{entry.note}</span>
                </div>
              )}

              {/* Actions (FR-21 Edit, FR-22 Delete) */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onEditEntry(entry)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryToDelete(entry)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FR-23: Confirmation before deletion */}
      <DeleteConfirmModal
        isOpen={Boolean(entryToDelete)}
        title="Delete Record"
        message={`Delete this ${entryToDelete?.type} of ${settings.currency}${entryToDelete?.amount}? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setEntryToDelete(null)}
      />
    </div>
  );
};

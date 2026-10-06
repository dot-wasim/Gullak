import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Entry, EntryType } from '../types';
import { X, ArrowDownRight, ArrowUpRight, Calendar, Tag, Briefcase, FileText, Check } from 'lucide-react';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: Entry | null;
}

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
  isOpen,
  onClose,
  entryToEdit,
}) => {
  const { settings, addEntry, updateEntry } = useApp();

  const [type, setType] = useState<EntryType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (entryToEdit) {
        setType(entryToEdit.type);
        setAmount(entryToEdit.amount.toString());
        setCategory(entryToEdit.category || settings.categories[0] || 'Other');
        setSource(entryToEdit.source || settings.incomeSources[0] || 'Salary');
        setDate(entryToEdit.date || new Date().toISOString().split('T')[0]);
        setNote(entryToEdit.note || '');
      } else {
        setType('expense');
        setAmount('');
        setCategory(settings.categories[0] || 'Food & Drinks');
        setSource(settings.incomeSources[0] || 'Salary');
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
      }
      setError('');
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, entryToEdit, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    // FR-05 requirement
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    if (type === 'expense' && !category) {
      setError('Please select an expense category.');
      return;
    }

    if (type === 'income' && !source) {
      setError('Please provide an income source.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (entryToEdit) {
        await updateEntry({
          id: entryToEdit.id,
          type,
          amount: parsedAmount,
          category: type === 'expense' ? category : undefined,
          source: type === 'income' ? source : undefined,
          date,
          note: note.trim() || undefined,
        });
      } else {
        await addEntry({
          type,
          amount: parsedAmount,
          category: type === 'expense' ? category : undefined,
          source: type === 'income' ? source : undefined,
          date,
          note: note.trim() || undefined,
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save entry';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {entryToEdit ? 'Edit Entry' : 'Add New Entry'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Type Selector (Expense vs Income) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (!category) setCategory(settings.categories[0]);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                if (!source) setSource(settings.incomeSources[0]);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Income</span>
            </button>
          </div>

          {/* Amount input (FR-01, FR-05, FR-06) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Amount ({settings.currency}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                {settings.currency}
              </span>
              <input
                ref={amountInputRef}
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 text-2xl font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
              />
            </div>
          </div>

          {/* Category (Expense - FR-02) or Source (Income - FR-07) */}
          {type === 'expense' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition cursor-pointer"
                >
                  {settings.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Income Source <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Salary, Freelance"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  list="income-sources-list"
                />
                <datalist id="income-sources-list">
                  {settings.incomeSources.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>
          )}

          {/* Date (FR-03, FR-08) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Date (defaults to today) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition cursor-pointer"
              />
            </div>
          </div>

          {/* Optional Note (FR-04, FR-09) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Note (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <textarea
                rows={2}
                placeholder="Optional details or note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{entryToEdit ? 'Save Changes' : `Add ${type === 'expense' ? 'Expense' : 'Income'}`}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

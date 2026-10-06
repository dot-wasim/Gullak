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
  const { settings, addEntry, updateEntry, addCustomIncomeSource } = useApp();

  const [type, setType] = useState<EntryType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [isCustomSource, setIsCustomSource] = useState(false);
  const [customSourceText, setCustomSourceText] = useState('');
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
        const existingSource = entryToEdit.source || settings.incomeSources[0] || 'Salary / Wages';
        if (settings.incomeSources.includes(existingSource)) {
          setSource(existingSource);
          setIsCustomSource(false);
          setCustomSourceText('');
        } else {
          setSource(existingSource);
          setIsCustomSource(true);
          setCustomSourceText(existingSource);
        }
        setDate(entryToEdit.date || new Date().toISOString().split('T')[0]);
        setNote(entryToEdit.note || '');
      } else {
        setType('expense');
        setAmount('');
        setCategory(settings.categories[0] || 'Food & Drinks');
        setSource(settings.incomeSources[0] || 'Salary / Wages');
        setIsCustomSource(false);
        setCustomSourceText('');
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

    const effectiveSource = isCustomSource ? customSourceText.trim() : source.trim();
    if (type === 'income' && !effectiveSource) {
      setError('Please select or enter an income stream.');
      return;
    }

    if (type === 'income' && isCustomSource && effectiveSource) {
      addCustomIncomeSource(effectiveSource);
    }

    setIsSubmitting(true);
    try {
      if (entryToEdit) {
        await updateEntry({
          id: entryToEdit.id,
          type,
          amount: parsedAmount,
          category: type === 'expense' ? category : undefined,
          source: type === 'income' ? effectiveSource : undefined,
          date,
          note: note.trim() || undefined,
        });
      } else {
        await addEntry({
          type,
          amount: parsedAmount,
          category: type === 'expense' ? category : undefined,
          source: type === 'income' ? effectiveSource : undefined,
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Income Stream <span className="text-emerald-600">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Multiple streams supported</span>
              </div>

              {/* Stream Select Chips */}
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                {settings.incomeSources.map((s) => {
                  const isSelected = !isCustomSource && source === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setIsCustomSource(false);
                        setSource(s);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{s}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsCustomSource(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    isCustomSource
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  + Custom Stream
                </button>
              </div>

              {/* Custom stream inline input when requested */}
              {isCustomSource ? (
                <div className="pt-1 space-y-1">
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type custom income stream (e.g. YouTube, Royalties, Consulting)..."
                      value={customSourceText}
                      onChange={(e) => setCustomSourceText(e.target.value)}
                      autoFocus
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-emerald-500 ring-2 ring-emerald-100 rounded-xl outline-none transition"
                    />
                  </div>
                  <p className="text-[11px] text-emerald-600">
                    This new income stream will be added to your stream list.
                  </p>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                  <span>Active stream: <strong className="text-emerald-700">{source}</strong></span>
                  <button
                    type="button"
                    onClick={() => setIsCustomSource(true)}
                    className="text-emerald-600 font-semibold hover:underline cursor-pointer"
                  >
                    + Add other stream
                  </button>
                </div>
              )}
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

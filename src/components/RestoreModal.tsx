import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BackupPayload } from '../types';
import { X, KeyRound, AlertTriangle, DownloadCloud, Loader2, CheckCircle2 } from 'lucide-react';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({ isOpen, onClose }) => {
  const { fetchBackupForRestore, confirmRestore, isOnline } = useApp();
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedPayload, setFetchedPayload] = useState<BackupPayload | null>(null);
  const [backupId, setBackupId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanKey = keyInput.trim();
    if (!cleanKey) {
      setError('Please enter your 12-word recovery key.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchBackupForRestore(cleanKey);
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.payload && result.backupId) {
        setFetchedPayload(result.payload);
        setBackupId(result.backupId);
      } else {
        setError('Could not read backup payload.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Restore request failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmApply = () => {
    if (!fetchedPayload || !backupId) return;
    const cleanKey = keyInput.trim();
    const result = confirmRestore(fetchedPayload, cleanKey, backupId);
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFetchedPayload(null);
        setBackupId(null);
        setKeyInput('');
        onClose();
      }, 1500);
    } else {
      setError(result.error || 'Failed to replace data.');
    }
  };

  const handleClose = () => {
    setError('');
    setFetchedPayload(null);
    setBackupId(null);
    setKeyInput('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <DownloadCloud className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">Restore from Backup</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!isOnline && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              Your device is offline. You need an active internet connection to download your backup.
            </div>
          )}

          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-slate-800">Restore Complete!</h3>
              <p className="text-xs text-slate-500">Your budget records have been successfully restored.</p>
            </div>
          ) : !fetchedPayload ? (
            /* Step 1: Input Recovery Key */
            <form onSubmit={handleFetch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Enter Recovery Key
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <textarea
                    rows={3}
                    placeholder="Enter your 12 recovery words separated by spaces..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition resize-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  The app will download and decrypt your encrypted backup directly on your device.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !isOnline}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Decrypting...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>Fetch & Decrypt Backup</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Confirm Overwrite (BR-11) */
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <h4 className="text-xs font-bold text-emerald-800">Backup Found & Decrypted!</h4>
                <div className="text-xs text-emerald-700 grid grid-cols-2 gap-2 pt-1">
                  <div>Entries: <strong>{fetchedPayload.entries?.length || 0}</strong></div>
                  <div>Goals: <strong>{fetchedPayload.goals?.length || 0}</strong></div>
                  <div className="col-span-2 text-[11px] text-emerald-600">
                    Saved on: {new Date(fetchedPayload.exportedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Warning Requirement BR-11 */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 leading-relaxed">
                  <strong className="block text-rose-800 font-semibold mb-0.5">Warning: Replace Local Data</strong>
                  Restoring will <strong>replace all existing records</strong> on this device with the backup data.
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFetchedPayload(null)}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition cursor-pointer shadow-xs"
                >
                  Confirm & Replace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  KeyRound,
  CloudUpload,
  DownloadCloud,
  ShieldAlert,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Lock,
  Wifi,
  WifiOff,
  Briefcase,
  Plus,
} from 'lucide-react';

interface SettingsViewProps {
  onOpenRestore: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenRestore }) => {
  const {
    backupMeta,
    runBackup,
    isBackingUp,
    isOnline,
    settings,
    addCustomIncomeSource,
  } = useApp();

  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [newStreamText, setNewStreamText] = useState('');

  const handleCopyKey = async () => {
    if (!backupMeta?.recoveryKey) return;
    try {
      await navigator.clipboard.writeText(backupMeta.recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  const handleManualBackup = async () => {
    setBackupMessage(null);
    const result = await runBackup();
    if (result.success) {
      setBackupMessage('Backup uploaded successfully!');
    } else {
      setBackupMessage(result.error || 'Backup failed.');
    }
    setTimeout(() => setBackupMessage(null), 4000);
  };

  const words = backupMeta?.recoveryKey ? backupMeta.recoveryKey.split(' ') : [];

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings & Security</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your secret key and zero-knowledge backups</p>
      </div>

      {/* Online / Offline Status Badge */}
      <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl">
        <div className="flex items-center gap-2.5">
          {isOnline ? (
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <WifiOff className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="text-xs font-bold text-slate-800">
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <div className="text-[11px] text-slate-400">
              {isOnline ? 'Automatic encrypted backup is active' : 'Offline. Backups pause until online'}
            </div>
          </div>
        </div>
      </div>

      {/* Backup Section (BR-07, BR-08, BR-09) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Encrypted Cloud Backup</h3>
              <p className="text-[11px] text-slate-400">AES-256-GCM zero-knowledge storage</p>
            </div>
          </div>
        </div>

        {/* BR-09: Last backup time */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Last backup:</span>
            <span className="font-semibold text-slate-800">
              {backupMeta?.lastBackupAt
                ? new Date(backupMeta.lastBackupAt).toLocaleString()
                : 'Never'}
            </span>
          </div>
          {backupMessage && (
            <p className="text-[11px] font-medium text-emerald-600 pt-1 border-t border-slate-200">
              {backupMessage}
            </p>
          )}
        </div>

        {/* Actions: Backup & Restore */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleManualBackup}
            disabled={isBackingUp || !isOnline}
            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isBackingUp ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Back Up Now</span>
          </button>

          <button
            type="button"
            onClick={onOpenRestore}
            className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-slate-600" />
            <span>Restore Data</span>
          </button>
        </div>
      </div>

      {/* Recovery Key Viewer (BR-06, 7.4) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recovery Key</h3>
              <p className="text-[11px] text-slate-400">Your private access phrase</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer transition"
          >
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showKey ? 'Hide' : 'Reveal'}</span>
          </button>
        </div>

        {showKey ? (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  12 Secret Words
                </span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {words.map((word, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded px-2 py-1.5 text-center text-xs font-mono text-slate-800 shadow-2xs"
                  >
                    <span className="text-slate-400 mr-1 text-[10px]">{i + 1}.</span>
                    {word}
                  </div>
                ))}
              </div>
            </div>

            {/* 7.4 Lost key rule */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Important:</strong> If you lose your recovery key, nobody can restore your data. The server does not keep a copy.
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
            <p className="text-xs text-slate-500 font-medium">
              Key is hidden for your privacy. Tap "Reveal" to view your 12 recovery words.
            </p>
          </div>
        )}
      </div>

      {/* Income Streams Management */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Income Streams ({settings.incomeSources.length})
            </h3>
            <p className="text-[11px] text-slate-400">Available income sources for transactions</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-2xl max-h-48 overflow-y-auto">
          {settings.incomeSources.map((src) => (
            <span
              key={src}
              className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-xs shadow-2xs"
            >
              {src}
            </span>
          ))}
        </div>

        {/* Add new stream */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newStreamText.trim()) {
              addCustomIncomeSource(newStreamText.trim());
              setNewStreamText('');
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Add new stream (e.g. YouTube, Royalties)..."
            value={newStreamText}
            onChange={(e) => setNewStreamText(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition"
          />
          <button
            type="submit"
            disabled={!newStreamText.trim()}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* App Information & Privacy */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-2xs text-xs text-slate-600">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Privacy & Specifications</span>
        </h4>
        <ul className="space-y-2 text-slate-500 list-disc list-inside">
          <li>Zero accounts: No email, phone number, or password required.</li>
          <li>Default currency: <strong>{settings.currency} (INR)</strong></li>
          <li>Client-side encryption: <strong>AES-256-GCM</strong> with <strong>PBKDF2</strong> key derivation.</li>
          <li>Zero server knowledge: Data is encrypted before leaving the device.</li>
          <li>Offline-ready PWA: Keep adding transactions without internet access.</li>
        </ul>
      </div>
    </div>
  );
};

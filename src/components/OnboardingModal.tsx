import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, ShieldAlert, Copy, Check, Lock } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { backupMeta, confirmKeySaved } = useApp();
  const [copied, setCopied] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  if (!backupMeta || backupMeta.hasSavedKey) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(backupMeta.recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
    }
  };

  const handleConfirm = () => {
    if (isChecked) {
      confirmKeySaved();
    }
  };

  const words = backupMeta.recoveryKey.split(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-6 text-white text-center">
          <div className="w-14 h-14 bg-emerald-500/80 rounded-full mx-auto flex items-center justify-center mb-3 shadow-inner">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Your Secret Recovery Key</h2>
          <p className="text-emerald-100 text-xs mt-1">
            Gullak uses no password and no phone number. This key is your only access code.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>12-Word Recovery Key</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-xs font-medium cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {words.map((word, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded px-2 py-1.5 text-center text-xs font-mono text-slate-800 shadow-2xs"
                >
                  <span className="text-slate-400 mr-1 text-[10px] select-none">{index + 1}.</span>
                  {word}
                </div>
              ))}
            </div>
          </div>

          {/* BR-04 & 7.4 Lost key warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Important rule:</p>
              <p className="mt-0.5">
                Save this key in a secure place. If you lose your recovery key, <strong>nobody can restore your data</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Encrypted with AES-256-GCM. The server cannot read your data.</span>
          </div>

          {/* BR-05 Checkbox confirmation */}
          <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition">
            <input
              type="checkbox"
              id="confirm-saved-key"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-medium select-none">
              I saved my key in a safe place. I understand that lost keys cannot be recovered.
            </span>
          </label>

          {/* BR-05 Continue button */}
          <button
            type="button"
            disabled={!isChecked}
            onClick={handleConfirm}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer ${
              isChecked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            I saved my key & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

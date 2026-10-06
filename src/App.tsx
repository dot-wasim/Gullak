import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Entry, Goal } from './types';
import { HomeView } from './components/HomeView';
import { HistoryView } from './components/HistoryView';
import { GoalsView } from './components/GoalsView';
import { SettingsView } from './components/SettingsView';
import { OnboardingModal } from './components/OnboardingModal';
import { AddEntryModal } from './components/AddEntryModal';
import { AddGoalModal } from './components/AddGoalModal';
import { AddMoneyModal } from './components/AddMoneyModal';
import { RestoreModal } from './components/RestoreModal';
import {
  Home,
  Clock,
  Target,
  Settings,
  Plus,
  PiggyBank,
  Download,
} from 'lucide-react';

type Tab = 'home' | 'history' | 'goals' | 'settings';

export const App: React.FC = () => {
  const { isInitialized, goals } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('home');

  // Modals state
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<Goal | null>(null);

  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  // Native PWA install handling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'To install as an app on your phone:\n\n• On Android: Tap Chrome menu (3 dots) -> "Install app" or "Add to Home Screen"\n• On iPhone: Tap Safari Share button (box with arrow) -> "Add to Home Screen"'
      );
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center animate-pulse mb-4">
          <PiggyBank className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Gullak</h1>
        <p className="text-xs text-slate-400 mt-1">Initializing private storage...</p>
      </div>
    );
  }

  const handleEditEntry = (entry: Entry) => {
    setEntryToEdit(entry);
    setIsAddEntryOpen(true);
  };

  const handleOpenDeposit = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId) || null;
    setSelectedGoalForDeposit(goal);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-slate-200/60 font-sans">
      {/* Top Brand Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xs">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900">Gullak</h1>
            <span className="text-[10px] font-semibold text-emerald-600 tracking-wider block -mt-1 uppercase">
              Private Budget
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isAppInstalled && (
            <button
              type="button"
              onClick={handleInstallApp}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
              title="Install as native app"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEntryToEdit(null);
              setIsAddEntryOpen(true);
            }}
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-emerald-200 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add</span>
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 px-4 pt-5 pb-6">
        {activeTab === 'home' && (
          <HomeView
            onOpenAddEntry={() => {
              setEntryToEdit(null);
              setIsAddEntryOpen(true);
            }}
            onNavigateToGoals={() => setActiveTab('goals')}
            onNavigateToHistory={() => setActiveTab('history')}
            onOpenDeposit={handleOpenDeposit}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView onEditEntry={handleEditEntry} />
        )}

        {activeTab === 'goals' && (
          <GoalsView
            onOpenAddGoal={() => setIsAddGoalOpen(true)}
            onOpenDeposit={handleOpenDeposit}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView onOpenRestore={() => setIsRestoreOpen(true)} />
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-2 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'home'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'history'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">History</span>
        </button>

        {/* Center Quick Add Action */}
        <button
          type="button"
          onClick={() => {
            setEntryToEdit(null);
            setIsAddEntryOpen(true);
          }}
          className="w-11 h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-600/30 -mt-4 transition cursor-pointer transform active:scale-95"
          title="Add Entry"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('goals')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'goals'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Target className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Goals</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'settings'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Settings</span>
        </button>
      </nav>

      {/* Modals */}
      <OnboardingModal onOpenRestore={() => setIsRestoreOpen(true)} />

      <AddEntryModal
        isOpen={isAddEntryOpen}
        onClose={() => {
          setIsAddEntryOpen(false);
          setEntryToEdit(null);
        }}
        entryToEdit={entryToEdit}
      />

      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
      />

      <AddMoneyModal
        goal={selectedGoalForDeposit}
        onClose={() => setSelectedGoalForDeposit(null)}
      />

      <RestoreModal
        isOpen={isRestoreOpen}
        onClose={() => setIsRestoreOpen(false)}
      />
    </div>
  );
};

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Entry, Goal, Settings, BackupMeta, BackupPayload } from '../types';
import {
  initStorage,
  getEntries,
  getGoals,
  getSettings,
  getBackupMeta,
  addEntry as dbAddEntry,
  updateEntry as dbUpdateEntry,
  deleteEntry as dbDeleteEntry,
  addGoal as dbAddGoal,
  updateGoal as dbUpdateGoal,
  deleteGoal as dbDeleteGoal,
  addMoneyToGoal as dbAddMoneyToGoal,
  addIncomeSource as dbAddIncomeSource,
  markKeySaved as dbMarkKeySaved,
  subscribeStorage
} from '../lib/storage';
import { performBackup, fetchAndDecryptBackup, applyRestoredData } from '../lib/backupService';

interface MonthSummary {
  income: number;
  expenses: number;
  balance: number;
}

interface AppContextType {
  entries: Entry[];
  goals: Goal[];
  settings: Settings;
  backupMeta: BackupMeta | null;
  isOnline: boolean;
  isInitialized: boolean;
  isBackingUp: boolean;
  lastBackupStatus: string | null;
  monthSummary: MonthSummary;
  addEntry: (entry: Omit<Entry, 'id'>) => Promise<boolean>;
  updateEntry: (entry: Entry) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<boolean>;
  addGoal: (goal: Omit<Goal, 'id' | 'saved'>) => Promise<boolean>;
  updateGoal: (goal: Goal) => Promise<boolean>;
  deleteGoal: (id: string) => Promise<boolean>;
  addMoneyToGoal: (id: string, amount: number) => Promise<boolean>;
  addCustomIncomeSource: (source: string) => void;
  confirmKeySaved: () => void;
  runBackup: () => Promise<{ success: boolean; error?: string }>;
  fetchBackupForRestore: (key: string) => Promise<{ payload?: BackupPayload; backupId?: string; error?: string }>;
  confirmRestore: (payload: BackupPayload, key: string, backupId: string) => { success: boolean; error?: string };
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [backupMeta, setBackupMeta] = useState<BackupMeta | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupStatus, setLastBackupStatus] = useState<string | null>(null);

  // Load from local storage
  const reloadFromStorage = useCallback(() => {
    setEntries(getEntries());
    setGoals(getGoals());
    setSettings(getSettings());
    setBackupMeta(getBackupMeta());
  }, []);

  // Online / offline detector
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-backup when device goes online (BR-08)
      triggerAutoBackup();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize storage & recovery key
  useEffect(() => {
    async function setup() {
      const meta = await initStorage();
      setBackupMeta(meta);
      reloadFromStorage();
      setIsInitialized(true);

      // Attempt automatic initial backup if key is saved and online (BR-08)
      if (meta.hasSavedKey && navigator.onLine) {
        performBackup().catch(() => {});
      }
    }
    setup();

    const unsubscribe = subscribeStorage(() => {
      reloadFromStorage();
    });

    return unsubscribe;
  }, [reloadFromStorage]);

  const triggerAutoBackup = async () => {
    const meta = getBackupMeta();
    if (meta && meta.hasSavedKey) {
      setIsBackingUp(true);
      const res = await performBackup();
      setIsBackingUp(false);
      if (res.success) {
        setLastBackupStatus('Backup succeeded');
      }
    }
  };

  // Month summary calculation (FR-15, FR-16, FR-17)
  const monthSummary = useMemo<MonthSummary>(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const entry of entries) {
      if (!entry.date) continue;
      const entryDate = new Date(entry.date);
      if (
        entryDate.getFullYear() === currentYear &&
        entryDate.getMonth() === currentMonth
      ) {
        if (entry.type === 'income') {
          totalIncome += entry.amount;
        } else if (entry.type === 'expense') {
          totalExpenses += entry.amount;
        }
      }
    }

    return {
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses,
    };
  }, [entries]);

  // Actions
  const addEntry = async (data: Omit<Entry, 'id'>) => {
    if (data.amount <= 0) {
      throw new Error('Amount must be greater than zero.');
    }
    const newEntry: Entry = {
      ...data,
      id: 'e_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    };
    dbAddEntry(newEntry);
    
    // Auto-backup in background if online (BR-08)
    if (navigator.onLine && backupMeta?.hasSavedKey) {
      performBackup().catch(() => {});
    }
    return true;
  };

  const updateEntry = async (entry: Entry) => {
    if (entry.amount <= 0) {
      throw new Error('Amount must be greater than zero.');
    }
    dbUpdateEntry(entry);
    if (navigator.onLine && backupMeta?.hasSavedKey) {
      performBackup().catch(() => {});
    }
    return true;
  };

  const deleteEntry = async (id: string) => {
    dbDeleteEntry(id);
    if (navigator.onLine && backupMeta?.hasSavedKey) {
      performBackup().catch(() => {});
    }
    return true;
  };

  const addGoal = async (data: Omit<Goal, 'id' | 'saved'>) => {
    if (data.target <= 0) {
      throw new Error('Target amount must be greater than zero.');
    }
    const newGoal: Goal = {
      ...data,
      id: 'g_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      saved: 0,
    };
    dbAddGoal(newGoal);
    if (navigator.onLine && backupMeta?.hasSavedKey) {
      performBackup().catch(() => {});
    }
    return true;
  };

  const updateGoal = async (goal: Goal) => {
    dbUpdateGoal(goal);
    if (navigator.onLine && backupMeta?.hasSavedKey) {
      performBackup().catch(() => {});
    }
    return true;
  };

  const deleteGoal = async (id: string) => {
    dbDeleteGoal(id);
    if (navigator.onLine && backupMeta?.hasSavedKey) {
      performBackup().catch(() => {});
    }
    return true;
  };

  const addMoneyToGoal = async (id: string, amount: number) => {
    if (amount <= 0) {
      throw new Error('Added money must be greater than zero.');
    }
    dbAddMoneyToGoal(id, amount);
    if (navigator.onLine && backupMeta?.hasSavedKey) {
      performBackup().catch(() => {});
    }
    return true;
  };

  const addCustomIncomeSource = (source: string) => {
    dbAddIncomeSource(source);
    setSettings(getSettings());
  };

  const confirmKeySaved = () => {
    dbMarkKeySaved();
    reloadFromStorage();
    if (navigator.onLine) {
      performBackup().catch(() => {});
    }
  };

  const runBackup = async () => {
    setIsBackingUp(true);
    const result = await performBackup();
    setIsBackingUp(false);
    if (result.success) {
      setLastBackupStatus('Backup succeeded at ' + new Date().toLocaleTimeString());
    } else {
      setLastBackupStatus('Backup failed: ' + result.error);
    }
    return result;
  };

  const fetchBackupForRestore = async (key: string) => {
    return await fetchAndDecryptBackup(key);
  };

  const confirmRestore = (payload: BackupPayload, key: string, backupId: string) => {
    const res = applyRestoredData(payload, key, backupId);
    if (res.success) {
      reloadFromStorage();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  return (
    <AppContext.Provider
      value={{
        entries,
        goals,
        settings,
        backupMeta,
        isOnline,
        isInitialized,
        isBackingUp,
        lastBackupStatus,
        monthSummary,
        addEntry,
        updateEntry,
        deleteEntry,
        addGoal,
        updateGoal,
        deleteGoal,
        addMoneyToGoal,
        addCustomIncomeSource,
        confirmKeySaved,
        runBackup,
        fetchBackupForRestore,
        confirmRestore,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}

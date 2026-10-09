import { Entry, Goal, Settings, BackupMeta, BackupPayload } from '../types';
import { generateRecoveryKey, deriveBackupId } from './crypto';

const STORAGE_KEYS = {
  ENTRIES: 'gullak_entries_v1',
  GOALS: 'gullak_goals_v1',
  SETTINGS: 'gullak_settings_v1',
  BACKUP_META: 'gullak_backup_meta_v1'
};

const DEFAULT_SETTINGS: Settings = {
  currency: '₹',
  categories: [
    'Food & Drinks',
    'Groceries',
    'Transport',
    'Housing & Rent',
    'Bills & Utilities',
    'Shopping',
    'Health',
    'Entertainment',
    'Education',
    'Other'
  ],
  incomeSources: [
    'Salary / Wages',
    'Freelance',
    'Business',
    'Investments & Dividends',
    'Rental Income',
    'Side Hustle',
    'Bonus & Incentives',
    'Interest & Savings',
    'Consulting',
    'Gift / Grant',
    'Refund / Cashback',
    'Other'
  ]
};

// In-memory cache
let cachedEntries: Entry[] | null = null;
let cachedGoals: Goal[] | null = null;
let cachedSettings: Settings | null = null;
let cachedMeta: BackupMeta | null = null;

// Listeners for reactive updates
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeStorage(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifySubscribers() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (e) {
      console.error('Subscriber notification error', e);
    }
  }
}

/**
 * Initialize storage and recovery key on first start (BR-01, BR-02, BR-03).
 */
export async function initStorage(): Promise<BackupMeta> {
  let meta = getBackupMeta();
  if (!meta) {
    const recoveryKey = generateRecoveryKey();
    const backupId = await deriveBackupId(recoveryKey);
    meta = {
      recoveryKey,
      backupId,
      hasSavedKey: false,
      lastBackupAt: null
    };
    saveBackupMeta(meta);
  }
  return meta;
}

export function getBackupMeta(): BackupMeta | null {
  if (cachedMeta) return cachedMeta;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BACKUP_META);
    if (raw) {
      cachedMeta = JSON.parse(raw);
      return cachedMeta;
    }
  } catch (err) {
    console.error('Error reading backup meta', err);
  }
  return null;
}

export function saveBackupMeta(meta: BackupMeta): void {
  cachedMeta = meta;
  try {
    localStorage.setItem(STORAGE_KEYS.BACKUP_META, JSON.stringify(meta));
  } catch (err) {
    console.error('Error saving backup meta', err);
  }
  notifySubscribers();
}

export function markKeySaved(): void {
  const meta = getBackupMeta();
  if (meta) {
    meta.hasSavedKey = true;
    saveBackupMeta(meta);
  }
}

export function updateLastBackupDate(isoString: string): void {
  const meta = getBackupMeta();
  if (meta) {
    meta.lastBackupAt = isoString;
    saveBackupMeta(meta);
  }
}

export function getSettings(): Settings {
  if (cachedSettings) return cachedSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const rawObj = JSON.parse(raw);
      // Ensure existing saved settings get all default income sources plus any user added ones
      const mergedSources = Array.isArray(rawObj.incomeSources)
        ? Array.from(new Set([...DEFAULT_SETTINGS.incomeSources, ...rawObj.incomeSources]))
        : DEFAULT_SETTINGS.incomeSources;
      const parsed: Settings = {
        ...DEFAULT_SETTINGS,
        ...rawObj,
        incomeSources: mergedSources
      };
      cachedSettings = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Error reading settings', err);
  }
  const defaultVal: Settings = { ...DEFAULT_SETTINGS };
  cachedSettings = defaultVal;
  return defaultVal;
}

export function saveSettings(settings: Settings): void {
  cachedSettings = settings;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings', err);
  }
  notifySubscribers();
}

export function addIncomeSource(source: string): void {
  const trimmed = source.trim();
  if (!trimmed) return;
  const current = getSettings();
  if (!current.incomeSources.includes(trimmed)) {
    const updated = {
      ...current,
      incomeSources: [...current.incomeSources, trimmed]
    };
    saveSettings(updated);
  }
}

export function getEntries(): Entry[] {
  if (cachedEntries) return cachedEntries;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (raw) {
      const parsed: Entry[] = JSON.parse(raw);
      // Sort newest first (FR-20)
      cachedEntries = sortEntriesNewestFirst(parsed);
      return cachedEntries;
    }
  } catch (err) {
    console.error('Error reading entries', err);
  }
  cachedEntries = [];
  return cachedEntries;
}

function sortEntriesNewestFirst(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.id.localeCompare(a.id);
  });
}

export function addEntry(entry: Entry): void {
  const entries = getEntries();
  const updated = sortEntriesNewestFirst([entry, ...entries]);
  cachedEntries = updated;
  try {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving entries', err);
  }
  notifySubscribers();
}

export function updateEntry(updatedEntry: Entry): void {
  const entries = getEntries();
  const updated = entries.map(e => (e.id === updatedEntry.id ? updatedEntry : e));
  const sorted = sortEntriesNewestFirst(updated);
  cachedEntries = sorted;
  try {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(sorted));
  } catch (err) {
    console.error('Error updating entry', err);
  }
  notifySubscribers();
}

export function deleteEntry(id: string): void {
  const entries = getEntries();
  const updated = entries.filter(e => e.id !== id);
  cachedEntries = updated;
  try {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting entry', err);
  }
  notifySubscribers();
}

export function getGoals(): Goal[] {
  if (cachedGoals) return cachedGoals;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (raw) {
      cachedGoals = JSON.parse(raw);
      return cachedGoals!;
    }
  } catch (err) {
    console.error('Error reading goals', err);
  }
  cachedGoals = [];
  return cachedGoals;
}

export function getGoalCreationDate(goal: Goal): Date {
  if (goal.createdAt) {
    return new Date(goal.createdAt);
  }
  const match = goal.id.match(/^g_(\d+)_/);
  if (match) {
    const ts = parseInt(match[1], 10);
    if (!isNaN(ts)) return new Date(ts);
  }
  return new Date();
}

export function getGoalDurationInfo(goal: Goal): { isCompleted: boolean; durationText: string; daysCount: number } {
  const startDate = getGoalCreationDate(goal);
  const isCompleted = goal.saved >= goal.target;
  const endDate = isCompleted ? (goal.completedAt ? new Date(goal.completedAt) : new Date()) : new Date();

  const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
  const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  if (isCompleted) {
    if (diffDays <= 1) {
      return { isCompleted: true, durationText: 'Completed in 1 day', daysCount: 1 };
    }
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      const remDays = diffDays % 7;
      const weekText = weeks > 0 ? (remDays > 0 ? ` (${weeks}w ${remDays}d)` : ` (${weeks}w)`) : '';
      return { isCompleted: true, durationText: `Completed in ${diffDays} days${weekText}`, daysCount: diffDays };
    }
    const months = Math.floor(diffDays / 30);
    const remDays = diffDays % 30;
    const monthText = remDays > 0 ? `${months} mo, ${remDays} d` : `${months} mo`;
    return { isCompleted: true, durationText: `Completed in ${monthText} (${diffDays} days)`, daysCount: diffDays };
  } else {
    if (diffDays <= 1) {
      return { isCompleted: false, durationText: 'Started today', daysCount: 1 };
    }
    return { isCompleted: false, durationText: `In progress for ${diffDays} days`, daysCount: diffDays };
  }
}

export function addGoal(goal: Goal): void {
  const goals = getGoals();
  const goalWithDates: Goal = {
    ...goal,
    createdAt: goal.createdAt || new Date().toISOString(),
    completedAt: goal.saved >= goal.target ? (goal.completedAt || new Date().toISOString()) : undefined,
  };
  const updated = [...goals, goalWithDates];
  cachedGoals = updated;
  try {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
  } catch (err) {
    console.error('Error adding goal', err);
  }
  notifySubscribers();
}

export function updateGoal(updatedGoal: Goal): void {
  const goals = getGoals();
  const normalizedGoal: Goal = {
    ...updatedGoal,
    createdAt: updatedGoal.createdAt || getGoalCreationDate(updatedGoal).toISOString(),
    completedAt: updatedGoal.saved >= updatedGoal.target
      ? (updatedGoal.completedAt || new Date().toISOString())
      : undefined
  };
  const updated = goals.map(g => (g.id === normalizedGoal.id ? normalizedGoal : g));
  cachedGoals = updated;
  try {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
  } catch (err) {
    console.error('Error updating goal', err);
  }
  notifySubscribers();
}

export function deleteGoal(id: string): void {
  const goals = getGoals();
  const updated = goals.filter(g => g.id !== id);
  cachedGoals = updated;
  try {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting goal', err);
  }
  notifySubscribers();
}

export function addMoneyToGoal(id: string, amount: number): void {
  if (amount <= 0) return;
  const goals = getGoals();
  const target = goals.find(g => g.id === id);
  if (!target) return;
  const newSaved = target.saved + amount;
  const isNowCompleted = newSaved >= target.target;
  const updatedGoal: Goal = {
    ...target,
    saved: newSaved,
    completedAt: isNowCompleted ? (target.completedAt || new Date().toISOString()) : undefined
  };
  updateGoal(updatedGoal);
}

/**
 * Returns full data bundle to be encrypted for backup (7.2).
 */
export function getAllDataForBackup(): BackupPayload {
  return {
    version: 1,
    entries: getEntries(),
    goals: getGoals(),
    settings: getSettings(),
    exportedAt: new Date().toISOString()
  };
}

/**
 * Replaces all local data with restored backup data (BR-11).
 */
export function replaceLocalData(payload: BackupPayload, recoveryKey: string, backupId: string): void {
  if (!payload || !Array.isArray(payload.entries)) {
    throw new Error('Invalid backup payload format.');
  }

  cachedEntries = sortEntriesNewestFirst(payload.entries);
  cachedGoals = payload.goals || [];
  cachedSettings = payload.settings || DEFAULT_SETTINGS;
  
  cachedMeta = {
    recoveryKey,
    backupId,
    hasSavedKey: true,
    lastBackupAt: payload.exportedAt || new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(cachedEntries));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(cachedGoals));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cachedSettings));
    localStorage.setItem(STORAGE_KEYS.BACKUP_META, JSON.stringify(cachedMeta));
  } catch (err) {
    console.error('Failed to save restored data to localStorage', err);
    throw new Error('Failed to write restored data to device storage.');
  }

  notifySubscribers();
}

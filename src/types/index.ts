export type EntryType = 'income' | 'expense';

export interface Entry {
  id: string;
  type: EntryType;
  amount: number;
  category?: string; // required for expense
  source?: string;   // required for income
  note?: string;     // optional
  date: string;      // YYYY-MM-DD, required
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string; // YYYY-MM-DD, optional
}

export interface Settings {
  currency: string;
  categories: string[];
  incomeSources: string[];
}

export interface BackupPayload {
  version: number;
  entries: Entry[];
  goals: Goal[];
  settings: Settings;
  exportedAt: string;
}

export interface BackupRecord {
  encryptedData: string;
  iv: string;
  version: number;
  updatedAt: string;
}

export interface BackupMeta {
  recoveryKey: string;
  backupId: string;
  hasSavedKey: boolean;
  lastBackupAt: string | null;
}

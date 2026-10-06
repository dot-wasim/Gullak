import { deriveEncryptionKey, deriveBackupId, encryptData, decryptData } from './crypto';
import { getAllDataForBackup, replaceLocalData, updateLastBackupDate, getBackupMeta } from './storage';
import { BackupPayload, BackupRecord } from '../types';

const API_BASE = '/api';

export interface BackupResult {
  success: boolean;
  timestamp?: string;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  entriesCount?: number;
  goalsCount?: number;
  error?: string;
}

/**
 * Executes zero-knowledge encrypted backup to the server (BR-07, BR-08).
 */
export async function performBackup(): Promise<BackupResult> {
  const meta = getBackupMeta();
  if (!meta || !meta.recoveryKey) {
    return { success: false, error: 'Recovery key not initialized.' };
  }

  if (!navigator.onLine) {
    return { success: false, error: 'Device is offline. Connect to internet to back up.' };
  }

  try {
    const payload = getAllDataForBackup();
    const encKey = await deriveEncryptionKey(meta.recoveryKey);
    const backupId = await deriveBackupId(meta.recoveryKey);

    const { encryptedData, iv } = await encryptData(encKey, payload);

    const response = await fetch(`${API_BASE}/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        backupId,
        encryptedData,
        iv,
        version: payload.version,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.error || `Server responded with status ${response.status}`,
      };
    }

    const resJson = await response.json();
    const timestamp = resJson.updatedAt || new Date().toISOString();
    updateLastBackupDate(timestamp);

    return { success: true, timestamp };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown backup error';
    return { success: false, error: message };
  }
}

/**
 * Fetches and decrypts backup from server using provided recovery key (7.3, BR-10, BR-12).
 * Does not replace local data yet - returns payload so user can confirm overwrite (BR-11).
 */
export async function fetchAndDecryptBackup(
  enteredKey: string
): Promise<{ payload?: BackupPayload; backupId?: string; error?: string }> {
  if (!navigator.onLine) {
    return { error: 'Device is offline. Connect to internet to restore.' };
  }

  try {
    const trimmedKey = enteredKey.trim();
    if (!trimmedKey) {
      return { error: 'Please enter your recovery key.' };
    }

    const backupId = await deriveBackupId(trimmedKey);
    const encKey = await deriveEncryptionKey(trimmedKey);

    const response = await fetch(`${API_BASE}/backup/${backupId}`);

    if (response.status === 404) {
      return { error: 'No backup found with this recovery key. Please check your key.' };
    }

    if (response.status === 429) {
      return { error: 'Too many restore attempts. Please wait 15 minutes before trying again.' };
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      return { error: errJson.error || `Restore failed with status ${response.status}` };
    }

    const record: BackupRecord = await response.json();

    // Decrypt on device
    const payload = await decryptData<BackupPayload>(encKey, record.encryptedData, record.iv);

    return { payload, backupId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to decrypt backup.';
    return { error: message };
  }
}

/**
 * Confirms and executes replacement of local data with decrypted payload (BR-11).
 */
export function applyRestoredData(
  payload: BackupPayload,
  recoveryKey: string,
  backupId: string
): RestoreResult {
  try {
    replaceLocalData(payload, recoveryKey, backupId);
    return {
      success: true,
      entriesCount: payload.entries?.length || 0,
      goalsCount: payload.goals?.length || 0,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to apply restore.';
    return { success: false, error: message };
  }
}

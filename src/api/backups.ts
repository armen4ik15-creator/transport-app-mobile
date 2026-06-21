import { api } from './client';

export interface BackupRemoteStatus {
  s3: boolean;
  webhook: boolean;
  telegram: boolean;
}

export interface BackupManifest {
  version: number;
  created_at: string;
  db_kind: string;
  uploads?: { file_count: number; size_bytes: number };
}

export interface BackupItem {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  manifest: BackupManifest | null;
}

export interface BackupStatus {
  enabled: boolean;
  running: boolean;
  intervalHours: number;
  keepLocalCount: number;
  remote: BackupRemoteStatus;
  lastResult: {
    ok: boolean;
    filename?: string;
    sizeBytes?: number;
    createdAt?: string;
    error?: string;
  } | null;
  latest: BackupItem | null;
  backups: BackupItem[];
}

export interface BackupRunResult {
  ok: boolean;
  filename: string;
  sizeBytes: number;
  createdAt: string;
  trigger: string;
  uploadsFileCount: number;
  downloadPath: string;
}

export async function getBackupStatus(): Promise<BackupStatus> {
  const { data } = await api.get<BackupStatus>('/backups/status');
  return data;
}

export async function listBackups(): Promise<BackupItem[]> {
  const { data } = await api.get<BackupItem[]>('/backups');
  return data;
}

export async function runBackup(uploadRemote = true): Promise<BackupRunResult> {
  const { data } = await api.post<BackupRunResult>('/backups/run', { uploadRemote });
  return data;
}

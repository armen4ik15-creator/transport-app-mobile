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

export interface BackupStorageHealth {
  data_dir: string;
  data_dir_writable: boolean;
  uploads_file_count: number;
  uploads_size_bytes: number;
  backup_file_count: number;
  warnings: string[];
  healthy: boolean;
}

export interface S3BackupItem {
  key: string;
  sizeBytes: number;
  lastModified: string | null;
  error?: string;
}

export interface BackupStatus {
  enabled: boolean;
  running: boolean;
  intervalHours: number;
  keepLocalCount: number;
  keepLocalDays?: number;
  cronSchedule?: string;
  remote: BackupRemoteStatus;
  storage?: BackupStorageHealth;
  s3Backups?: S3BackupItem[];
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

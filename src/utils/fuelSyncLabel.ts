export function formatFuelSyncLabel(
  lastSyncAt: string | null,
  newCount: number,
  status: 'ok' | 'error' | null
): string {
  if (!lastSyncAt) {
    return 'Синхронизация ещё не выполнялась';
  }

  const syncedAt = new Date(lastSyncAt.replace(' ', 'T'));
  const diffMs = Date.now() - syncedAt.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));

  let ago = 'только что';
  if (diffMin >= 60) {
    const hours = Math.floor(diffMin / 60);
    ago = `${hours} ч назад`;
  } else if (diffMin > 0) {
    ago = `${diffMin} мин назад`;
  }

  const freshPart = newCount > 0 ? `, ${newCount} нов.` : '';
  const statusPart = status === 'error' ? ' · ошибка' : '';
  return `Последняя синхронизация: ${ago}${freshPart}${statusPart}`;
}

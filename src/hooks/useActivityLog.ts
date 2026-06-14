import { useState, useCallback } from 'react';
import { activityLogService, type ActivityLog } from '../services/activityLog';

export function useActivityLog(boardId: string) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await activityLogService.getLogs(boardId);
      setLogs(data);
    } catch {
      // silently fail — activity log is non-critical
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  return { logs, loading, fetchLogs };
}

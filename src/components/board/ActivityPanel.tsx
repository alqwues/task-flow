import { useEffect } from 'react';
import { Drawer, List, Avatar, Typography, Skeleton, Empty } from 'antd';
import dayjs from 'dayjs';
import { useActivityLog } from '../../hooks/useActivityLog';
import type { ActivityLog } from '../../services/activityLog';

const { Text } = Typography;

function formatAction(log: ActivityLog): string {
  const name = log.profile?.name ?? log.profile?.email ?? 'Someone';
  switch (log.action) {
    case 'task_created':
      return `${name} created "${log.meta.task_title ?? 'a task'}" in ${log.meta.column ?? 'a column'}`;
    case 'task_moved':
      return `${name} moved "${log.meta.task_title ?? 'a task'}" to ${log.meta.to_column ?? 'a column'}`;
    case 'task_deleted':
      return `${name} deleted "${log.meta.task_title ?? 'a task'}"`;
    case 'task_updated':
      return `${name} updated "${log.meta.task_title ?? 'a task'}"`;
    default:
      return `${name} made a change`;
  }
}

interface Props {
  boardId: string;
  open: boolean;
  onClose: () => void;
}

export function ActivityPanel({ boardId, open, onClose }: Props) {
  const { logs, loading, fetchLogs } = useActivityLog(boardId);

  useEffect(() => {
    if (open) fetchLogs();
  }, [open, fetchLogs]);

  return (
    <Drawer title="Activity" open={open} onClose={onClose} width={360}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : logs.length === 0 ? (
        <Empty description="No activity yet" style={{ marginTop: 64 }} />
      ) : (
        <List
          dataSource={logs}
          renderItem={(log) => (
            <List.Item style={{ padding: '8px 0', alignItems: 'flex-start' }}>
              <List.Item.Meta
                avatar={
                  <Avatar size={28} style={{ backgroundColor: '#1677ff', fontSize: 11, flexShrink: 0 }}>
                    {(log.profile?.name ?? log.profile?.email ?? 'U')[0].toUpperCase()}
                  </Avatar>
                }
                title={<Text style={{ fontSize: 13 }}>{formatAction(log)}</Text>}
                description={
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(log.created_at).format('MMM D, HH:mm')}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
}

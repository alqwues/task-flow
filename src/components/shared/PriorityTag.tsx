import { Tag } from 'antd';
import type { Priority } from '../../types';

const config: Record<Priority, { color: string; label: string }> = {
  low: { color: 'green', label: 'Low' },
  medium: { color: 'orange', label: 'Medium' },
  high: { color: 'red', label: 'High' },
};

interface Props {
  priority: Priority;
}

export function PriorityTag({ priority }: Props) {
  const { color, label } = config[priority];
  return <Tag color={color}>{label}</Tag>;
}

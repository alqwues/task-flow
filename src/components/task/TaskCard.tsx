import { Card, Typography, Flex, Tooltip, Avatar } from 'antd';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RiDeleteBinLine, RiCalendarLine } from 'react-icons/ri';
import { PriorityTag } from '../shared/PriorityTag';
import type { Task } from '../../types';

const { Text } = Typography;

interface Props {
  task: Task;
  onOpen: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onOpen, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        size="small"
        style={{ marginBottom: 8, cursor: 'grab' }}
        styles={{ body: { padding: '10px 12px' } }}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(task);
        }}
      >
        <Text style={{ display: 'block', marginBottom: 8 }}>{task.title}</Text>

        <Flex justify="space-between" align="center">
          <Flex gap={6} align="center">
            <PriorityTag priority={task.priority} />
            {task.due_date && (
              <Tooltip title={task.due_date}>
                <Flex align="center" gap={4}>
                  <RiCalendarLine size={13} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {task.due_date}
                  </Text>
                </Flex>
              </Tooltip>
            )}
          </Flex>

          <Flex align="center" gap={6}>
            {task.assignee?.name && (
              <Avatar size={22} style={{ backgroundColor: '#1677ff', fontSize: 11 }}>
                {task.assignee.name[0].toUpperCase()}
              </Avatar>
            )}
            <RiDeleteBinLine
              size={15}
              style={{ cursor: 'pointer', color: '#ff4d4f' }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            />
          </Flex>
        </Flex>
      </Card>
    </div>
  );
}

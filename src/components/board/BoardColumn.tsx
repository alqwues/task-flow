import { useState } from 'react';
import { Typography, Button, Input, Flex, Popconfirm, Tooltip } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import { TaskCard } from '../task/TaskCard';
import type { Column, Task } from '../../types';

const { Text } = Typography;

interface Props {
  column: Column;
  tasks: Task[];
  onRename: (columnId: string, title: string) => void;
  onDelete: (columnId: string) => void;
  onAddTask: (columnId: string, title: string) => void;
  onOpenTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function BoardColumn({
  column,
  tasks,
  onRename,
  onDelete,
  onAddTask,
  onOpenTask,
  onDeleteTask,
}: Props) {
  const [editTitle, setEditTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column', column } });

  const confirmRename = () => {
    if (titleValue.trim() && titleValue !== column.title) {
      onRename(column.id, titleValue.trim());
    }
    setEditTitle(false);
  };

  const cancelRename = () => {
    setTitleValue(column.title);
    setEditTitle(false);
  };

  const confirmAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(column.id, newTaskTitle.trim());
    }
    setNewTaskTitle('');
    setAddingTask(false);
  };

  return (
    <div
      style={{
        width: 'min(280px, 80vw)',
        flexShrink: 0,
        backgroundColor: isOver ? '#e6f4ff' : '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        transition: 'background-color 0.15s',
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        {editTitle ? (
          <Flex gap={4} align="center" style={{ flex: 1 }}>
            <Input
              size="small"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onPressEnter={confirmRename}
              autoFocus
              style={{ flex: 1 }}
            />
            <RiCheckLine
              size={16}
              style={{ cursor: 'pointer', color: '#52c41a' }}
              onClick={confirmRename}
            />
            <RiCloseLine
              size={16}
              style={{ cursor: 'pointer', color: '#ff4d4f' }}
              onClick={cancelRename}
            />
          </Flex>
        ) : (
          <Flex align="center" gap={6}>
            <Text strong style={{ fontSize: 14 }}>
              {column.title}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({tasks.length})
            </Text>
          </Flex>
        )}

        {!editTitle && (
          <Flex gap={4}>
            <Tooltip title="Rename">
              <RiEditLine
                size={15}
                style={{ cursor: 'pointer', color: '#8c8c8c' }}
                onClick={() => setEditTitle(true)}
              />
            </Tooltip>
            <Popconfirm title="Delete column and all its tasks?" onConfirm={() => onDelete(column.id)}>
              <Tooltip title="Delete">
                <RiDeleteBinLine size={15} style={{ cursor: 'pointer', color: '#ff4d4f' }} />
              </Tooltip>
            </Popconfirm>
          </Flex>
        )}
      </Flex>

      <div ref={setNodeRef} style={{ minHeight: 4 }}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={onOpenTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
      </div>

      {addingTask ? (
        <div style={{ marginTop: 8 }}>
          <Input
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onPressEnter={confirmAddTask}
            autoFocus
            style={{ marginBottom: 6 }}
          />
          <Flex gap={6}>
            <Button size="small" type="primary" onClick={confirmAddTask}>
              Add
            </Button>
            <Button size="small" onClick={() => setAddingTask(false)}>
              Cancel
            </Button>
          </Flex>
        </div>
      ) : (
        <Button
          type="dashed"
          icon={<RiAddLine />}
          block
          style={{ marginTop: 8 }}
          onClick={() => setAddingTask(true)}
        >
          Add task
        </Button>
      )}
    </div>
  );
}

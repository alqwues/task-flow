import { useEffect, useState, useRef } from 'react';
import { Flex, Button, Input, Skeleton, Select } from 'antd';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { RiAddLine, RiSearchLine } from 'react-icons/ri';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from '../task/TaskCard';
import { TaskModal } from '../task/TaskModal';
import { useBoardData } from '../../hooks/useBoardData';
import { useTaskDetail } from '../../hooks/useTaskDetail';
import { useBoardStore } from '../../store/boardStore';
import type { Priority, Task } from '../../types';

interface Props {
  boardId: string;
}

const PRIORITY_FILTER_OPTIONS = [
  { label: 'All priorities', value: '' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

export function BoardView({ boardId }: Props) {
  const { columns, tasks, loading, fetchBoardData, createColumn, renameColumn, deleteColumn, createTask, deleteTask, moveTask } =
    useBoardData(boardId);
  const { openTask } = useTaskDetail();
  const { setTasks } = useBoardStore();

  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const firstColumnRef = useRef<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  useEffect(() => {
    firstColumnRef.current = columns[0]?.id ?? null;
  }, [columns]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'n' && firstColumnRef.current) {
        createTask(firstColumnRef.current, 'New task');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [createTask]);

  const filterTasks = (columnTasks: Task[]) => {
    return columnTasks.filter((t) => {
      const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      const matchesPriority = !priorityFilter || t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  };

  const getColumnTasks = (columnId: string) =>
    tasks.filter((t) => t.column_id === columnId).sort((a, b) => a.position - b.position);

  const onDragStart = ({ active }: DragStartEvent) => {
    const task = tasks.find((t) => t.id === active.id);
    if (task) setDraggingTask(task);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const overId = over.id as string;
    const overTask = tasks.find((t) => t.id === overId);
    const targetColumnId = overTask ? overTask.column_id : overId;

    const targetColumn = columns.find((c) => c.id === targetColumnId);
    if (!targetColumn) return;

    const columnTasks = getColumnTasks(targetColumnId);

    if (task.column_id === targetColumnId) {
      const oldIndex = columnTasks.findIndex((t) => t.id === taskId);
      const newIndex = overTask ? columnTasks.findIndex((t) => t.id === overId) : columnTasks.length;
      if (oldIndex === newIndex) return;
      const reordered = arrayMove(columnTasks, oldIndex, newIndex);
      const updated = reordered.map((t, i) => ({ ...t, position: i }));
      const newTasks = tasks.map((t) => updated.find((u) => u.id === t.id) ?? t);
      setTasks(newTasks);
      updated.forEach((t) => moveTask(t.id, t.column_id, t.position));
    } else {
      const newPosition = overTask
        ? columnTasks.findIndex((t) => t.id === overId)
        : columnTasks.length;
      moveTask(taskId, targetColumnId, newPosition);
    }
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      createColumn(newColumnTitle.trim());
    }
    setNewColumnTitle('');
    setAddingColumn(false);
  };

  if (loading) {
    return (
      <Flex gap={12} style={{ padding: 16, overflowX: 'auto' }}>
        {[1, 2, 3].map((i) => (
          <Skeleton.Node key={i} active style={{ width: 280, height: 400, borderRadius: 8 }} />
        ))}
      </Flex>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <Flex
        gap={8}
        align="center"
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff',
        }}
      >
        <Input
          placeholder="Search tasks..."
          prefix={<RiSearchLine size={14} color="#8c8c8c" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 220 }}
        />
        <Select
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={PRIORITY_FILTER_OPTIONS}
          style={{ width: 150 }}
        />
      </Flex>

      <Flex gap={12} style={{ padding: '16px', overflowX: 'auto', alignItems: 'flex-start', minHeight: 'calc(100vh - 152px)', WebkitOverflowScrolling: 'touch' }}>
        {columns.map((col) => (
          <BoardColumn
            key={col.id}
            column={col}
            tasks={filterTasks(getColumnTasks(col.id))}
            onRename={renameColumn}
            onDelete={deleteColumn}
            onAddTask={createTask}
            onOpenTask={openTask}
            onDeleteTask={deleteTask}
          />
        ))}

        {addingColumn ? (
          <div style={{ width: 'min(280px, 80vw)', flexShrink: 0 }}>
            <Input
              placeholder="Column title"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              onPressEnter={handleAddColumn}
              autoFocus
              style={{ marginBottom: 6 }}
            />
            <Flex gap={6}>
              <Button type="primary" size="small" onClick={handleAddColumn}>
                Add
              </Button>
              <Button size="small" onClick={() => setAddingColumn(false)}>
                Cancel
              </Button>
            </Flex>
          </div>
        ) : (
          <Button
            type="dashed"
            icon={<RiAddLine />}
            style={{ width: 'min(280px, 80vw)', flexShrink: 0, height: 40 }}
            onClick={() => setAddingColumn(true)}
          >
            Add column
          </Button>
        )}
      </Flex>

      <DragOverlay>
        {draggingTask && (
          <TaskCard task={draggingTask} onOpen={() => {}} onDelete={() => {}} />
        )}
      </DragOverlay>

      <TaskModal />
    </DndContext>
  );
}

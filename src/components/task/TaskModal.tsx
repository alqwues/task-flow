import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Typography,
  Flex,
  Divider,
  Skeleton,
  Avatar,
  Popconfirm,
} from 'antd';
import dayjs from 'dayjs';
import { RiDeleteBinLine, RiSendPlaneLine, RiUserLine } from 'react-icons/ri';
import { PriorityTag } from '../shared/PriorityTag';
import { useTaskDetail } from '../../hooks/useTaskDetail';
import { useAuthStore } from '../../store/authStore';
import { useBoardStore } from '../../store/boardStore';
import { boardsService } from '../../services/boards';
import type { Priority, BoardMember } from '../../types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const PRIORITY_OPTIONS: { label: string; value: Priority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

export function TaskModal() {
  const { activeTask, comments, commentsLoading, closeTask, saveTask, postComment, deleteComment } =
    useTaskDetail();
  const user = useAuthStore((s) => s.user);
  const { currentBoard } = useBoardStore();
  const [form] = Form.useForm();
  const [commentText, setCommentText] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState<BoardMember[]>([]);

  useEffect(() => {
    if (activeTask) {
      form.setFieldsValue({
        title: activeTask.title,
        description: activeTask.description,
        priority: activeTask.priority,
        due_date: activeTask.due_date ? dayjs(activeTask.due_date) : null,
        assignee_id: activeTask.assignee_id ?? undefined,
      });
    }
  }, [activeTask, form]);

  useEffect(() => {
    if (!currentBoard) return;
    boardsService.getMembers(currentBoard.id).then((data) => setMembers(data as BoardMember[]));
  }, [currentBoard]);

  const memberOptions = members.map((m) => ({
    value: m.user_id,
    label: m.profile?.name ?? m.profile?.email ?? m.user_id,
  }));

  const onSave = async () => {
    if (!activeTask) return;
    const values = await form.validateFields();
    setSaving(true);
    await saveTask(activeTask.id, {
      title: values.title,
      description: values.description ?? null,
      priority: values.priority,
      due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
      assignee_id: values.assignee_id ?? null,
    });
    setSaving(false);
  };

  const onComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    await postComment(commentText.trim());
    setCommentText('');
    setSending(false);
  };

  return (
    <Modal
      open={!!activeTask}
      onCancel={closeTask}
      footer={null}
      width={640}
      title={<Text strong>Task details</Text>}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Add description..." />
        </Form.Item>

        <Flex gap={12}>
          <Form.Item name="priority" label="Priority" style={{ flex: 1 }}>
            <Select options={PRIORITY_OPTIONS} />
          </Form.Item>

          <Form.Item name="due_date" label="Due date" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Flex>

        <Form.Item name="assignee_id" label="Assignee">
          <Select
            options={memberOptions}
            allowClear
            placeholder="Unassigned"
            suffixIcon={<RiUserLine />}
          />
        </Form.Item>

        <Button type="primary" onClick={onSave} loading={saving}>
          Save
        </Button>
      </Form>

      <Divider />

      <Text strong>Comments</Text>

      {commentsLoading ? (
        <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 12 }} />
      ) : (
        <div style={{ marginTop: 12 }}>
          {comments.map((c) => (
            <Flex key={c.id} gap={10} style={{ marginBottom: 12 }} align="flex-start">
              <Avatar size={28} style={{ backgroundColor: '#1677ff', flexShrink: 0, fontSize: 12 }}>
                {(c.profile?.name ?? 'U')[0].toUpperCase()}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Flex justify="space-between" align="center">
                  <Text strong style={{ fontSize: 13 }}>
                    {c.profile?.name ?? 'User'}
                  </Text>
                  <Flex align="center" gap={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(c.created_at).format('MMM D, HH:mm')}
                    </Text>
                    {c.user_id === user?.id && (
                      <Popconfirm title="Delete comment?" onConfirm={() => deleteComment(c.id)}>
                        <RiDeleteBinLine size={14} style={{ cursor: 'pointer', color: '#ff4d4f' }} />
                      </Popconfirm>
                    )}
                  </Flex>
                </Flex>
                <Paragraph style={{ margin: 0, fontSize: 13 }}>{c.content}</Paragraph>
              </div>
            </Flex>
          ))}

          <Flex gap={8} style={{ marginTop: 8 }}>
            <Input
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onPressEnter={onComment}
            />
            <Button
              type="primary"
              icon={<RiSendPlaneLine />}
              onClick={onComment}
              loading={sending}
            />
          </Flex>
        </div>
      )}
    </Modal>
  );
}

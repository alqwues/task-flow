import { useEffect, useState } from 'react';
import { Modal, Input, Button, Avatar, Flex, Typography, Tag, Popconfirm, Skeleton } from 'antd';
import { RiAddLine, RiDeleteBinLine, RiUserLine } from 'react-icons/ri';
import { useMembers } from '../../hooks/useMembers';
import { useAuthStore } from '../../store/authStore';
import { useBoardStore } from '../../store/boardStore';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MembersPanel({ open, onClose }: Props) {
  const { currentBoard } = useBoardStore();
  const user = useAuthStore((s) => s.user);
  const boardId = currentBoard?.id ?? '';
  const { members, loading, fetchMembers, inviteMember, removeMember } = useMembers(boardId);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (open && boardId) fetchMembers();
  }, [open, boardId, fetchMembers]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    await inviteMember(email.trim());
    setEmail('');
    setInviting(false);
  };

  const isOwner = currentBoard?.owner_id === user?.id;

  return (
    <Modal title="Board members" open={open} onCancel={onClose} footer={null} width={440}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <div>
          {members.map((m) => (
            <Flex key={m.id} align="center" justify="space-between" style={{ marginBottom: 12 }}>
              <Flex align="center" gap={10}>
                <Avatar size={32} icon={<RiUserLine />} style={{ backgroundColor: '#1677ff', flexShrink: 0 }}>
                  {m.profile?.name?.[0]?.toUpperCase()}
                </Avatar>
                <div>
                  <Text strong style={{ fontSize: 13 }}>{m.profile?.name ?? m.profile?.email ?? 'Unknown'}</Text>
                  {m.profile?.email && (
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{m.profile.email}</Text>
                  )}
                </div>
              </Flex>
              <Flex align="center" gap={8}>
                <Tag color={m.role === 'owner' ? 'blue' : 'default'}>{m.role}</Tag>
                {isOwner && m.role !== 'owner' && (
                  <Popconfirm title="Remove this member?" onConfirm={() => removeMember(m.id)}>
                    <RiDeleteBinLine size={15} style={{ cursor: 'pointer', color: '#ff4d4f' }} />
                  </Popconfirm>
                )}
              </Flex>
            </Flex>
          ))}

          {isOwner && (
            <Flex gap={8} style={{ marginTop: 16 }}>
              <Input
                placeholder="Invite by email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onPressEnter={handleInvite}
              />
              <Button
                type="primary"
                icon={<RiAddLine />}
                onClick={handleInvite}
                loading={inviting}
              >
                Invite
              </Button>
            </Flex>
          )}
        </div>
      )}
    </Modal>
  );
}

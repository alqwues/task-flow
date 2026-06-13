import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Input,
  Modal,
  Popconfirm,
  Empty,
  Skeleton,
  Flex,
} from 'antd';
import { RiAddLine, RiDeleteBinLine, RiLayoutColumnLine } from 'react-icons/ri';
import { useBoards } from '../hooks/useBoards';

const { Title, Text } = Typography;

export function BoardsPage() {
  const { boards, loading, fetchBoards, createBoard, deleteBoard } = useBoards();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreate = async () => {
    if (!boardTitle.trim()) return;
    setCreating(true);
    await createBoard(boardTitle.trim());
    setBoardTitle('');
    setModalOpen(false);
    setCreating(false);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          My Boards
        </Title>
        <Button type="primary" icon={<RiAddLine />} onClick={() => setModalOpen(true)}>
          New board
        </Button>
      </Flex>

      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3].map((i) => (
            <Col key={i} xs={24} sm={12} md={8}>
              <Skeleton active />
            </Col>
          ))}
        </Row>
      ) : boards.length === 0 ? (
        <Empty description="No boards yet. Create your first one!" />
      ) : (
        <Row gutter={[16, 16]}>
          {boards.map((board) => (
            <Col key={board.id} xs={24} sm={12} md={8}>
              <Card
                hoverable
                onClick={() => navigate(`/board/${board.id}`)}
                styles={{ body: { padding: 20 } }}
                actions={[
                  <Popconfirm
                    key="delete"
                    title="Delete this board?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      deleteBoard(board.id);
                    }}
                    onPopupClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<RiDeleteBinLine />}
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Delete
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Flex align="center" gap={10}>
                  <RiLayoutColumnLine size={22} color="#1677ff" />
                  <div>
                    <Text strong style={{ fontSize: 15 }}>
                      {board.title}
                    </Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      {new Date(board.created_at).toLocaleDateString()}
                    </Text>
                  </div>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="New board"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        confirmLoading={creating}
        okText="Create"
      >
        <Input
          placeholder="Board title"
          value={boardTitle}
          onChange={(e) => setBoardTitle(e.target.value)}
          onPressEnter={handleCreate}
          style={{ marginTop: 12 }}
          autoFocus
        />
      </Modal>
    </div>
  );
}

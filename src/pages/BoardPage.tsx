import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Flex, theme } from 'antd';
import { RiArrowLeftLine, RiHistoryLine, RiTeamLine } from 'react-icons/ri';
import { BoardView } from '../components/board/BoardView';
import { MembersPanel } from '../components/board/MembersPanel';
import { ActivityPanel } from '../components/board/ActivityPanel';
import { useBoardStore } from '../store/boardStore';
import { supabase } from '../services/supabase';

const { Text } = Typography;

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBoard, setCurrentBoard } = useBoardStore();
  const { token } = theme.useToken();
  const [membersOpen, setMembersOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setCurrentBoard(data));

    return () => setCurrentBoard(null);
  }, [id, setCurrentBoard]);

  if (!id) return null;

  return (
    <div>
      <Flex
        align="center"
        justify="space-between"
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          backgroundColor: token.colorBgContainer,
          minHeight: 48,
        }}
      >
        <Flex align="center" gap={8} style={{ overflow: 'hidden' }}>
          <Button
            type="text"
            size="small"
            icon={<RiArrowLeftLine />}
            onClick={() => navigate('/')}
            style={{ flexShrink: 0 }}
          />
          <Text
            strong
            style={{
              fontSize: 15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentBoard?.title ?? 'Board'}
          </Text>
        </Flex>

        <Flex gap={8}>
          <Button size="small" icon={<RiHistoryLine />} onClick={() => setActivityOpen(true)}>
            Activity
          </Button>
          <Button size="small" icon={<RiTeamLine />} onClick={() => setMembersOpen(true)}>
            Members
          </Button>
        </Flex>
      </Flex>

      <BoardView boardId={id} />

      <MembersPanel open={membersOpen} onClose={() => setMembersOpen(false)} />
      {id && <ActivityPanel boardId={id} open={activityOpen} onClose={() => setActivityOpen(false)} />}
    </div>
  );
}

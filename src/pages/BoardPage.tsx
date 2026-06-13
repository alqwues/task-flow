import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Flex } from 'antd';
import { RiArrowLeftLine, RiTeamLine } from 'react-icons/ri';
import { BoardView } from '../components/board/BoardView';
import { MembersPanel } from '../components/board/MembersPanel';
import { useBoardStore } from '../store/boardStore';
import { supabase } from '../services/supabase';

const { Text } = Typography;

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBoard, setCurrentBoard } = useBoardStore();
  const [membersOpen, setMembersOpen] = useState(false);

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
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff',
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

        <Button
          size="small"
          icon={<RiTeamLine />}
          onClick={() => setMembersOpen(true)}
        >
          Members
        </Button>
      </Flex>

      <BoardView boardId={id} />

      <MembersPanel open={membersOpen} onClose={() => setMembersOpen(false)} />
    </div>
  );
}

import { type ReactNode, useEffect, useState } from 'react';
import { Layout, Flex, Avatar, Typography, Dropdown, type MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { RiLayout3Line, RiLogoutBoxLine, RiUserLine, RiUserSettingsLine } from 'react-icons/ri';
import { authService } from '../../services/auth';
import { profilesService } from '../../services/profiles';
import { useAuthStore } from '../../store/authStore';

const { Header, Content } = Layout;
const { Text } = Typography;

interface Props {
  children: ReactNode;
}

export function AppLayout({ children }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    profilesService.getProfile(user.id).then((p) => setAvatarUrl(p?.avatar_url ?? null));
  }, [user]);

  const initials = user?.email?.[0]?.toUpperCase() ?? 'U';

  const menuItems: MenuProps['items'] = [
    {
      key: 'email',
      label: <Text type="secondary" style={{ fontSize: 12 }}>{user?.email}</Text>,
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <RiUserSettingsLine />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key: 'signout',
      icon: <RiLogoutBoxLine />,
      label: 'Sign out',
      danger: true,
      onClick: () => authService.signOut(),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: 56,
          lineHeight: '56px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Flex
          align="center"
          gap={8}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate('/')}
        >
          <RiLayout3Line size={20} color="#1677ff" />
          <Text strong style={{ fontSize: 15, whiteSpace: 'nowrap' }}>
            TaskFlow
          </Text>
        </Flex>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
          <Avatar
            src={avatarUrl}
            icon={!avatarUrl && <RiUserLine />}
            style={{ backgroundColor: '#1677ff', cursor: 'pointer', flexShrink: 0 }}
          >
            {!avatarUrl && initials}
          </Avatar>
        </Dropdown>
      </Header>

      <Content>{children}</Content>
    </Layout>
  );
}

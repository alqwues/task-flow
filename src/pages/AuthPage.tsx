import { useState } from 'react';
import { Card, Flex, theme } from 'antd';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { token } = theme.useToken();

  return (
    <Flex justify="center" align="center" style={{ minHeight: '100vh', backgroundColor: token.colorBgLayout }}>
      <Card style={{ width: 400 }}>
        {mode === 'login' ? (
          <LoginForm onSwitch={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitch={() => setMode('login')} />
        )}
      </Card>
    </Flex>
  );
}
